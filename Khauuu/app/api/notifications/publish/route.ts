import { NextRequest, NextResponse } from 'next/server';
import { ablyServer, NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from '@/lib/ably';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipient_id, 
      sender_id, 
      type, 
      title, 
      message, 
      data, 
      notification_id 
    } = body;

    if (!recipient_id || !notification_id) {
      return NextResponse.json(
        { error: 'recipient_id and notification_id are required' },
        { status: 400 }
      );
    }

    // Publish new notification to the user's channel
    try {
      const channel = ablyServer.channels.get(NOTIFICATION_CHANNELS.USER_NOTIFICATIONS(recipient_id));
      await channel.publish(NOTIFICATION_EVENTS.NEW_NOTIFICATION, {
        id: notification_id,
        type,
        title,
        message,
        data: data || {},
        sender_id,
        recipient_id,
        read: false,
        timestamp: new Date().toISOString()
      });

      // Also update unread count
      await channel.publish(NOTIFICATION_EVENTS.UNREAD_COUNT_UPDATED, {
        userId: recipient_id,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Notification published successfully'
      });

    } catch (ablyError) {
      console.error('Error publishing to Ably:', ablyError);
      return NextResponse.json(
        { error: 'Failed to publish notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in notification publish API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}