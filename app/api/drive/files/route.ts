import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Google OAuth bearer token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const pageSize = searchParams.get('pageSize') || '30';
    const filterType = searchParams.get('type') || 'all';

    let qExpr = "trashed = false";
    if (filterType === 'images') {
      qExpr += " and mimeType contains 'image/'";
    } else if (filterType === 'videos') {
      qExpr += " and (mimeType contains 'video/' or mimeType contains 'quicktime')";
    } else if (filterType === 'audio') {
      qExpr += " and (mimeType contains 'audio/' or mimeType contains 'sound')";
    } else if (filterType === 'documents') {
      qExpr += " and (mimeType contains 'document' or mimeType contains 'pdf' or mimeType contains 'text')";
    }

    if (query.trim()) {
      // Escape single quotes for drive query
      const sanitized = query.replace(/'/g, "\\'");
      qExpr += ` and name contains '${sanitized}'`;
    }

    const driveUrl = new URL('https://www.googleapis.com/drive/v3/files');
    driveUrl.searchParams.set('q', qExpr);
    driveUrl.searchParams.set('pageSize', pageSize);
    driveUrl.searchParams.set(
      'fields',
      'files(id, name, mimeType, size, thumbnailLink, webViewLink, webContentLink, createdTime, modifiedTime, iconLink, description)'
    );
    driveUrl.searchParams.set('orderBy', 'modifiedTime desc');

    const response = await fetch(driveUrl.toString(), {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Google Drive API error: ${response.statusText}`, details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      files: data.files || [],
      nextPageToken: data.nextPageToken,
    });
  } catch (error: any) {
    console.error('Google Drive GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list Google Drive files' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Google OAuth bearer token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, mimeType = 'text/plain', content, base64Content, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Prepare multipart upload to Google Drive v3
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name,
      mimeType,
      description: description || 'Generated and saved via Chronicle AI Studio',
    };

    let fileData: string | Buffer;
    if (base64Content) {
      fileData = Buffer.from(base64Content, 'base64');
    } else {
      fileData = content || '';
    }

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
          metadata
        )}\r\n`
      ),
      Buffer.from(`${delimiter}Content-Type: ${mimeType}\r\n\r\n`),
      typeof fileData === 'string' ? Buffer.from(fileData) : fileData,
      Buffer.from(closeDelimiter),
    ]);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString(),
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      return NextResponse.json(
        { error: `Google Drive Upload error: ${uploadResponse.statusText}`, details: errText },
        { status: uploadResponse.status }
      );
    }

    const file = await uploadResponse.json();
    return NextResponse.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Google Drive POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}
