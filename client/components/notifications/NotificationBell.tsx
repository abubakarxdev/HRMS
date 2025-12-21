import React, { useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Fallback support for older notifications where link might be in data JSON
    const navLink = notification.link || notification.data?.link;
    
    if (navLink) {
      setIsOpen(false);
      navigate(navLink);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-300 group"
      >
        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse pointer-events-none" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200 origin-top-right ring-1 ring-slate-900/5">
             {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/50">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center">
                    <Bell className="w-8 h-8 opacity-20 mb-3" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      px-4 py-4 border-b border-slate-50 cursor-pointer transition-all duration-200 group
                      ${!notification.isRead ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50' : 'bg-slate-300'}`} />
                      
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-snug ${!notification.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                          {notification.title} {notification.data?.status === 'Approved' && '😊'} {notification.data?.status === 'Rejected' && '😔'}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-[10px] font-medium text-slate-400">
                             {dayjs(notification.createdAt).fromNow()}
                           </span>
                           {notification.link && (
                               <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
