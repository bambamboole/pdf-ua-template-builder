export const controlClass =
  "w-full min-w-0 min-h-8 rounded-md border border-solid border-stone-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-900 outline-none transition-colors hover:border-stone-300 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

export const selectChevronClass =
  "appearance-none bg-[linear-gradient(45deg,transparent_50%,#6b6b6b_50%),linear-gradient(135deg,#6b6b6b_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-no-repeat";

export const selectControlClass =
  `h-8 w-auto min-w-0 cursor-pointer rounded-md border border-solid border-stone-200 bg-white py-0 pl-3 pr-7 text-stone-900 outline-none transition-colors hover:border-stone-300 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20 ${selectChevronClass}`;

export const fieldLabelClass =
  "grid min-w-0 gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-500";

export const checkboxLabelClass =
  "grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-stone-500";

export const arrayFieldClass =
  "col-span-full grid min-w-0 gap-2 rounded-md border border-solid border-stone-200 p-3";

export const arrayLegendClass =
  "px-2 text-[11px] font-medium uppercase tracking-wide text-stone-500";

export const arrayItemSortableClass =
  "relative grid gap-2 rounded-md border border-solid border-stone-200 bg-stone-100 py-3 pr-8 pl-8";

export const arrayHandleClass =
  "absolute top-2 left-2 inline-grid h-[22px] w-[22px] cursor-grab place-items-center rounded border-0 bg-transparent p-0 font-mono text-xs tracking-tighter text-stone-500 hover:bg-white hover:text-stone-900 active:cursor-grabbing";

export const arrayRemoveClass =
  "absolute top-2 right-2 inline-grid h-[22px] w-[22px] cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-xs text-stone-500 hover:bg-red-50 hover:text-red-700";

export const arrayAddClass =
  "h-7 w-fit cursor-pointer rounded-md border border-dashed border-stone-300 bg-transparent px-3 text-[11px] text-stone-500 hover:border-indigo-600 hover:text-indigo-600";
