import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Google OAuth bearer token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const altMedia = searchParams.get('alt') === 'media';

    const url = altMedia
      ? `https://www.googleapis.com/drive/v3/files/${id}?alt=media`
      : `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,createdTime,modifiedTime,description`;

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Google Drive error: ${response.statusText}`, details: errText },
        { status: response.status }
      );
    }

    if (altMedia) {
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || `inline; filename="${id}"`,
        },
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, file: data });
  } catch (error: any) {
    console.error('Google Drive GET by ID error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Google Drive file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Google OAuth bearer token' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Google Drive deletion error: ${response.statusText}`, details: errText },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `File ${id} successfully deleted from Google Drive`,
    });
  } catch (error: any) {
    console.error('Google Drive DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete Google Drive file' },
      { status: 500 }
    );
  }
}
