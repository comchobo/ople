export const focusClass =
  "focus-visible:outline-2 focus-visible:outline-[#222] focus-visible:outline-offset-3";
const buttonBase = `min-h-11 cursor-pointer rounded-[3px] border leading-[1.4] disabled:cursor-default disabled:opacity-45 ${focusClass}`;
const buttonSurface =
  "border-[#d4d4d4] bg-white hover:border-[#999] hover:bg-[#f3f3f3]";
export const buttonClass = `${buttonBase} ${buttonSurface} px-3.5 py-[9px]`;
export const primaryButtonClass = `${buttonBase} border-[#222] bg-[#222] px-3.5 py-[9px] text-white hover:border-[#999] hover:bg-[#444]`;
export const textButtonClass = `${buttonBase} border-transparent bg-transparent p-2 underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3]`;
export const iconButtonClass = `${buttonBase} ${buttonSurface} inline-grid w-11 shrink-0 place-items-center p-0`;
