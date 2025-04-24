
import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Notification } from '@/lib/types';
import { getUserNotifications, markNotificationAsRead, subscribeToNotifications } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function NotificationsMenu() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Load notifications
  useEffect(() => {
    if (!user) return;
    
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await getUserNotifications(user.id);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
    
    // Subscribe to new notifications
    const subscribeToNewNotifications = async () => {
      const subscription = await subscribeToNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      });
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };
    
    const unsubscribe = subscribeToNewNotifications();
    return () => {
      unsubscribe.then(unsub => unsub && unsub());
    };
  }, [user]);
  
  const handleOpenChange = (openState: boolean) => {
    setOpen(openState);
    
    // Mark notifications as read when opening
    if (openState && user) {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      unreadNotifications.forEach(async (notification) => {
        try {
          await markNotificationAsRead(notification.id);
          // Update local state
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
          );
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'fine':
        return '💰';
      case 'alert':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 bg-primary text-primary-foreground">
          <h3 className="font-medium">Notifications</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-96 overflow-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={cn(
                  "p-3 border-b",
                  !notification.is_read && "bg-muted/50"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
