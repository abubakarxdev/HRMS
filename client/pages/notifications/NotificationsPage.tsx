import React, { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Check, MailOpen, Bell, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { apiClient as api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

dayjs.extend(relativeTime);

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    isLoading,
    deleteNotification,
    clearAllNotifications 
  } = useNotifications();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const navLink = notification.link || notification.data?.link;
    if (navLink) {
        if (typeof navLink === 'string' && navLink.includes('leaves')) {
            queryClient.invalidateQueries({ queryKey: ['leaves'] });
        }
        navigate(navLink);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleClearAll = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmClearAll = () => {
    clearAllNotifications();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
            Notifications
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage your alerts and updates
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-3">
             <button
              onClick={() => markAllAsRead()}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition-all duration-200 shadow-sm"
            >
              <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Mark as read</span>
            </button>
            <button
              onClick={handleClearAll}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all duration-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden ring-1 ring-slate-900/5">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-slate-400 font-medium animate-pulse">Loading updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-24 text-center flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-100">
              <Bell className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">All caught up!</h3>
            <p className="text-slate-500 text-lg max-w-sm mx-auto">
                You have no new notifications at the moment.
            </p>
          </motion.div>
        ) : (
          <div className="divide-y divide-slate-100">
            <AnimatePresence mode='popLayout'>
              {notifications.map((notification: any, index: number) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group relative p-6 flex gap-5 cursor-pointer transition-all duration-300
                    ${!notification.isRead 
                        ? "bg-gradient-to-r from-indigo-50/80 to-white hover:from-indigo-50" 
                        : "bg-white hover:bg-slate-50"
                    }
                  `}
                >
                  {/* Unread Indicator */}
                  <div className={`mt-2 w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-colors duration-300 ${!notification.isRead ? "bg-indigo-500 ring-4 ring-indigo-100" : "bg-slate-200"}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className={`text-lg leading-snug mb-1 transition-colors ${!notification.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-slate-600 text-base leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 pl-2">
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full">
                          {dayjs(notification.createdAt).fromNow()}
                        </span>
                        
                        {/* Action Buttons (visible on hover) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                            <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmClearAll}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
      />
    </div>
  );
};

export default NotificationsPage;
