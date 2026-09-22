import { useContext } from "react";
import { ToastActionsContext } from "./ToastContexts";
import { ToastType } from "./Toast";

interface messageActions {
    displayInfoMessage: (
      message: string,
      duration: number,
      bootstrapClasses?: string,
    ) => string, 
    displayErrorMessage: (
      message: string,
      bootstrapClasses?: string,
    ) => string,
    deleteMessage: (messageId: string) => void,
    deleteAllMessages: () => void,
};

export default function useMessageActions(): messageActions {
    const { displayToast, deleteToast, deleteAllToasts } = useContext(ToastActionsContext);
    
    return {
        displayInfoMessage: (message: string, duration: number, bootstrapClasses?: string) => {
            return displayToast(ToastType.Info, message, duration, undefined, bootstrapClasses);
        },
        displayErrorMessage: (message: string, bootstrapClasses?: string) => {
            return displayToast(ToastType.Error, message, 0, undefined, bootstrapClasses);
        },
        deleteMessage: (messageId: string) => {
            return deleteToast(messageId);
        },
        deleteAllMessages: () => {
            return deleteAllToasts();
        },
    };
}