import { cn } from "@/lib/utils";
import { MessageCircleMore } from "lucide-react";
import Image from "next/image";
import { Handle, NodeProps, Position } from "reactflow";

export const MessageNode = ({ selected, data }: NodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div
        className={cn(
          "w-80 flex flex-col rounded-md overflow-hidden shadow-md",
          selected ? "outline outline-indigo-500" : ""
        )}
      >
        <div className="bg-teal-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleMore size={20} />
            <p className="text-sm font-bold">Send Message</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <Image
              src="whatsapp.svg"
              alt="whatsapp"
              width={16}
              height={16}
              className="cursor-pointer"
            />
          </div>
        </div>
        <div className="p-4 bg-white">
          <p className="text-sm text-slate-700">{data.text}</p>
        </div>
      </div>
    </>
  );
};
