import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function AlertMessage({
  open,
  title,
  description,
  action,
  onCancel,
  full,
}: {
  open: boolean;
  title: string;
  description: string | ReactNode;
  action?: ReactNode;
  onCancel: () => void;
  full?: boolean;
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn({ "w-full h-full max-w-full": full })}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          {action && <AlertDialogAction>{action}</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
