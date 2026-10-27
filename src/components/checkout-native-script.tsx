"use client";

import { useEffect } from "react";

export function CheckoutNativeScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/checkout-interactions.js";
    script.async = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);
  return null;
}
