"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export default function Spinner() {
  return (
   <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin w-6 h-6 text-primary" />
      
  );
}
