import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      contentType, 
      contentId, 
      message, 
      recipientIds 
    } = body;

    // Validate required fields
    if (!contentType || !contentId || !recipientIds || !Array.isArray(recipientIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, contentId, recipientIds' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!['food', 'restaurant'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Must be "food" or "restaurant"' },
        { status: 400 }
      );
    }

    // Verify the content exists
    const { data: contentExists, error: contentError } = await supabaseServer
      .from(contentType === 'food' ? 'foods' : 'restaurants')
      .select('id')
      .eq('id', contentId)
      .single();

    if (contentError || !contentExists) {
      return NextResponse.json(
        { error: `${contentType} not found` },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];

    // Process each recipient
    for (const recipientId of recipientIds) {
      try {
        // Call the share_content_in_message function
        const { data: shareResult, error: shareError } = await supabaseServer
          .rpc('share_content_in_message', {
            p_sender_id: user.id,
            p_recipient_id: recipientId,
            p_content_type: contentType,
            p_content_id: contentId,
            p_message_content: message || null
          });

        if (shareError) {
          console.error('Share error for recipient', recipientId, ':', shareError);
          errors.push({
            recipientId,
            error: shareError.message
          });
        } else {
          results.push({
            recipientId,
            conversationId: shareResult?.conversation_id,
            messageId: shareResult?.message_id,
            sharedContentId: shareResult?.shared_content_id
          });
        }
      } catch (error) {
        console.error('Unexpected error sharing with recipient', recipientId, ':', error);
        errors.push({
          recipientId,
          error: 'Unexpected error occurred'
        });
      }
    }

    // Return results
    const response = {
      success: results.length > 0,
      shared: results.length,
      total: recipientIds.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    const statusCode = results.length > 0 ? 200 : 400;
    
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}