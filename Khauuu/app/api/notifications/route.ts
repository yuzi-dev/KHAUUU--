import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { ablyServer, NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from '@/lib/ably';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';

    // Use the new function to fetch notifications with sender info
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_notifications_with_sender', {
        target_user_id: user.id,
        limit_count: limit,
        offset_count: offset,
        unread_only: unreadOnly
      });

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Transform notifications to match the expected format
    const transformedNotifications = notifications?.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      user: {
        user_id: notification.sender_id,
        username: notification.sender_username,
        full_name: notification.sender_full_name,
        profile_image_url: notification.sender_profile_image_url
      },
      timestamp: notification.created_at,
      read: notification.read,
      data: notification.data || {}
    })) || [];

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications_partitioned')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
      unread_count: unreadCount || 0,
      has_more: transformedNotifications.length === limit
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_id, read, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all notifications as read
      const { error: updateError } = await supabase
        .from('notifications_partitioned')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      // Publish real-time update for all notifications marked as read
      try {
        const channel = ablyServer.channels.get(NOTIFICATION_CHANNELS.USER_NOTIFICATIONS(user.id));
        await channel.publish(NOTIFICATION_EVENTS.NOTIFICATION_READ, {
          type: 'bulk_read',
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      } catch (ablyError) {
        console.error('Error publishing to Ably:', ablyError);
        // Don't fail the request if Ably fails
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required' },
        { status: 400 }
      );
    }

    // Update specific notification
    const { error: updateError } = await supabase
      .from('notifications_partitioned')
      .update({ 
        read: read !== undefined ? read : true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', notification_id)
      .eq('recipient_id', user.id);

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    // Publish real-time update for single notification
    try {
      const channel = ablyServer.channels.get(NOTIFICATION_CHANNELS.USER_NOTIFICATIONS(user.id));
      await channel.publish(NOTIFICATION_EVENTS.NOTIFICATION_READ, {
        type: 'single_read',
        notificationId: notification_id,
        read: read !== undefined ? read : true,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } catch (ablyError) {
      console.error('Error publishing to Ably:', ablyError);
      // Don't fail the request if Ably fails
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error in notifications PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required' },
        { status: 400 }
      );
    }

    // Delete specific notification
    const { error: deleteError } = await supabase
      .from('notifications_partitioned')
      .delete()
      .eq('id', notification_id)
      .eq('recipient_id', user.id);

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    // Publish real-time update for deleted notification
    try {
      const channel = ablyServer.channels.get(NOTIFICATION_CHANNELS.USER_NOTIFICATIONS(user.id));
      await channel.publish(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, {
        notificationId: notification_id,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } catch (ablyError) {
      console.error('Error publishing to Ably:', ablyError);
      // Don't fail the request if Ably fails
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error in notifications DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}