import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../css/common/sidebarOnboarding.css";

const STORAGE_KEY = "sidebarOnboardingV1";

type OnboardingStep = "trigger" | "pin";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SidebarOnboardingProps {
  enabled: boolean;
  flyoutVisible: boolean;
  docked: boolean;
  pinButtonRef: React.RefObject<HTMLButtonElement | null>;
  onGuideActiveChange: (active: boolean) => void;
  onEnsureFlyoutOpen: () => void;
  onPinStepChange: (active: boolean) => void;
}

const readCompleted = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const markCompleted = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
};

const SidebarOnboarding = ({
  enabled,
  flyoutVisible,
  docked,
  pinButtonRef,
  onGuideActiveChange,
  onEnsureFlyoutOpen,
  onPinStepChange,
}: SidebarOnboardingProps) => {
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [pinAnchor, setPinAnchor] = useState<Rect | null>(null);
  const [entered, setEntered] = useState(false);

  const complete = useCallback(() => {
    markCompleted();
    onGuideActiveChange(false);
    setStep(null);
    setSpotlight(null);
  }, [onGuideActiveChange]);

  useEffect(() => {
    onGuideActiveChange(step === "pin");
    onPinStepChange(step === "pin");
    if (step === "pin") {
      onEnsureFlyoutOpen();
    }
  }, [step, onGuideActiveChange, onEnsureFlyoutOpen, onPinStepChange]);

  useEffect(() => {
    if (!enabled || readCompleted() || docked) {
      onGuideActiveChange(false);
      onPinStepChange(false);
      setStep(null);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!readCompleted()) {
        setStep("trigger");
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [enabled, docked]);

  useEffect(() => {
    if (step !== "trigger" || !flyoutVisible) return;
    onEnsureFlyoutOpen();
    const timer = window.setTimeout(() => setStep("pin"), 400);
    return () => window.clearTimeout(timer);
  }, [step, flyoutVisible, onEnsureFlyoutOpen]);

  useEffect(() => {
    if (docked && step) {
      complete();
    }
  }, [docked, step, complete]);

  useEffect(() => {
    if (!step) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const updatePinAnchor = useCallback(() => {
    const pinEl = pinButtonRef.current;
    if (!pinEl) return;

    const rect = pinEl.getBoundingClientRect();
    setPinAnchor({
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }, [pinButtonRef]);

  const updateSpotlight = useCallback(() => {
    if (!step) return;

    if (step === "trigger") {
      const line = document.querySelector(".left-marks-trigger-line");
      if (line) {
        const rect = line.getBoundingClientRect();
        setSpotlight({
          top: rect.top - 14,
          left: rect.left - 10,
          width: rect.width + 20,
          height: rect.height + 28,
        });
        return;
      }

      setSpotlight({
        top: window.innerHeight / 2 - 46,
        left: 0,
        width: 28,
        height: 92,
      });
      return;
    }

    updatePinAnchor();
  }, [step, pinButtonRef, updatePinAnchor]);

  useLayoutEffect(() => {
    if (step === "pin") {
      updatePinAnchor();

      const flyout = document.querySelector(".left-marks--flyout");
      const handleTransitionEnd = (event: Event) => {
        if (event instanceof TransitionEvent && event.propertyName !== "transform") return;
        updatePinAnchor();
      };
      const handleLayoutChange = () => updatePinAnchor();

      flyout?.addEventListener("transitionend", handleTransitionEnd);
      window.addEventListener("resize", handleLayoutChange);
      const syncTimer = window.setInterval(updatePinAnchor, 80);
      const stopTimer = window.setTimeout(() => {
        window.clearInterval(syncTimer);
        updatePinAnchor();
      }, 420);

      return () => {
        flyout?.removeEventListener("transitionend", handleTransitionEnd);
        window.removeEventListener("resize", handleLayoutChange);
        window.clearInterval(syncTimer);
        window.clearTimeout(stopTimer);
      };
    }

    updateSpotlight();
    if (!step) return;

    const handle = () => updateSpotlight();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [step, flyoutVisible, updateSpotlight, updatePinAnchor]);

  if (!step) return null;
  if (step === "trigger" && !spotlight) return null;
  if (step === "pin" && !pinAnchor) return null;

  const isTriggerStep = step === "trigger";
  const anchor = isTriggerStep ? spotlight! : pinAnchor!;

  const pinPointerStyle = {
    top: anchor.top + anchor.height + 4,
    left: anchor.left + anchor.width / 2 - 14,
  };

  const pinSpotlightStyle = {
    top: anchor.top - 4,
    left: anchor.left - 4,
    width: anchor.width + 8,
    height: anchor.height + 8,
  };

  const pinCardStyle = (() => {
    const flyout = document.querySelector(".left-marks--flyout");
    const flyoutRight = flyout?.getBoundingClientRect().right ?? anchor.left + anchor.width;
    return {
      top: anchor.top + anchor.height + 18,
      left: Math.max(anchor.left + anchor.width + 56, flyoutRight + 20),
    };
  })();

  return createPortal(
    <div
      className={`sidebar-onboarding${entered ? " is-visible" : ""}${isTriggerStep ? "" : " is-pin-step"}`}
      role="dialog"
      aria-modal="true"
      aria-label="侧边栏新手指引"
    >
      <div
        className={`sidebar-onboarding-spotlight${isTriggerStep ? " is-trigger" : " is-pin"}`}
        style={isTriggerStep ? {
          top: anchor.top,
          left: anchor.left,
          width: anchor.width,
          height: anchor.height,
        } : pinSpotlightStyle}
      />

      <div
          className={`sidebar-onboarding-pointer${isTriggerStep ? " is-trigger" : " is-pin"}`}
          style={
            isTriggerStep
              ? {
                  top: anchor.top + anchor.height / 2 - 16,
                  left: anchor.left + anchor.width + 10,
                }
              : pinPointerStyle
          }
          aria-hidden="true"
        >
          {isTriggerStep ? "👈" : "👆"}
        </div>

        <div
          className={`sidebar-onboarding-card${isTriggerStep ? " is-trigger" : " is-pin"}`}
          style={
            isTriggerStep
              ? {
                  top: anchor.top + anchor.height / 2,
                  left: anchor.left + anchor.width + 44,
                }
              : pinCardStyle
          }
        >
          <p className="sidebar-onboarding-kicker">新手指引 {isTriggerStep ? "1/2" : "2/2"}</p>
          <p className="sidebar-onboarding-title">
            {isTriggerStep ? "从这里打开导航" : "固定侧栏更方便"}
          </p>
          <p className="sidebar-onboarding-desc">
            {isTriggerStep
              ? "把鼠标移到屏幕最左侧，导航菜单会滑出来。"
              : "点击图钉可以把侧栏固定住，右侧内容会自动让出空间。"}
          </p>
          <div className="sidebar-onboarding-actions">
            <button type="button" className="sidebar-onboarding-skip" onClick={complete}>
              跳过
            </button>
            {!isTriggerStep && (
              <button type="button" className="sidebar-onboarding-confirm" onClick={complete}>
                知道了
              </button>
            )}
          </div>
        </div>
    </div>,
    document.body
  );
};

export default SidebarOnboarding;
