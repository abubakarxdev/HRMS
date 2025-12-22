import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../api/services/notification.service';
import { toast } from 'sonner';
import { Bell, X, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationResponse {
  notifications: any[];
  unreadCount: number;
}

export const useNotifications = (enabled = true) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const previousNotificationsRef = useRef<any[]>([]);
  const isFirstLoadRef = useRef(true);

  const query = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    enabled,
    refetchInterval: 30000,
  });

  const notifications = query.data?.notifications || [];
  const unreadCount = query.data?.unreadCount || 0;

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sound.wav');
    audioRef.current.load();
  }, []);

  // Active Alert System
  useEffect(() => {
    if (query.isLoading) return;

    if (isFirstLoadRef.current) {
      if (notifications.length > 0) {
        previousNotificationsRef.current = notifications;
      }
      isFirstLoadRef.current = false;
      return;
    }

    const previousNotifications = previousNotificationsRef.current;

    const newNotifications = notifications.filter((n: any) =>
      !previousNotifications.some((prev: any) => prev.id === n.id)
    );

    if (newNotifications.length > 0) {
      try {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error("Audio playback failed:", error);
                });
            }
        }
      } catch (e) { 
        console.error("Audio error:", e);
      }

      if (newNotifications.length === 1) {
        const notif = newNotifications[0];
        const link = notif.link || notif.data?.link;
        
        toast.custom((t) => (
          <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md ring-1 ring-black/5 animate-in slide-in-from-top-2">
            <div className="flex w-full items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Bell className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-1 pt-0.5">
                  <p className="font-bold text-slate-800 leading-none">
                    {notif.title || 'New Notification'}
                  </p>
                  <p className="text-sm text-slate-500 leading-snug line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                
                 <button
                  onClick={() => toast.dismiss(t)}
                  className="flex-shrink-0 rounded-full p-1 text-slate-400 opacity-50 transition-opacity hover:opacity-100 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
            </div>
            
            {link && (
                <div className="flex justify-end pl-12">
                   <button
                     onClick={() => {
                        navigate(link);
                        toast.dismiss(t);
                     }}
                     className="group flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                   >
                     View Details
                     <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
            )}
          </div>
        ), { duration: 6000 });

      } else {
        toast.custom((t) => (
           <div className="flex w-full items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md ring-1 ring-black/5 animate-in slide-in-from-top-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <span className="font-bold">{newNotifications.length}</span>
            </div>
            <div className="flex-1">
               <p className="font-bold text-slate-800">New Messages</p>
               <p className="text-sm text-slate-500">You have {newNotifications.length} new updates</p>
            </div>
             <button
               onClick={() => toast.dismiss(t)}
               className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
               <X className="h-4 w-4" />
            </button>
          </div>
        ));
      }

      previousNotificationsRef.current = notifications;
    }
  }, [notifications, query.isLoading]);

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.custom((t) => (
        <div className="flex w-full items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md ring-1 ring-black/5 animate-in slide-in-from-top-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Check className="h-5 w-5" />
            </div>
            <div>
               <p className="font-bold text-slate-800 text-sm">Success</p>
               <p className="text-sm text-slate-500">All notifications marked as read</p>
            </div>
            <button
               onClick={() => toast.dismiss(t)}
               className="ml-auto rounded-full p-1 text-slate-400 hover:bg-slate-100"
            >
               <X className="h-4 w-4" />
            </button>
        </div>
      ));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.custom((t) => (
        <div className="flex w-full items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md ring-1 ring-black/5 animate-in slide-in-from-top-2">
             <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
               <Check className="h-5 w-5" />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-sm">Removed</p>
                <p className="text-sm text-slate-500">Notification deleted successfully</p>
             </div>
        </div>
      ), { duration: 3000 });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationService.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.custom((t) => (
         <div className="flex w-full items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md ring-1 ring-black/5 animate-in slide-in-from-top-2">
             <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
               <Check className="h-5 w-5" />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-sm">Cleared</p>
                <p className="text-sm text-slate-500">All notifications have been cleared</p>
             </div>
         </div>
      ));
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    clearAllNotifications: clearAllMutation.mutate,
  };
};
