"use client";

import { useEffect, useRef } from "react";

export default function PlannerPreview() {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[74.625rem] p-6 text-neutral-800 lg:p-8">
      <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold">
        내 플래너
      </h1>
    </main>
  );
}
