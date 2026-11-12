"use client";

type StartButtonProps = {
  isLoggedIn: boolean;
  onLogin: () => void;
  onNavigate: (page: "planners") => void;
  className?: string;
  "aria-label"?: string;
};

export default function StartButton({
  isLoggedIn,
  onLogin,
  onNavigate,
  className = "primary",
  "aria-label": ariaLabel,
}: StartButtonProps) {
  function handleClick() {
    if (isLoggedIn) {
      onNavigate("planners");
    } else {
      onLogin();
    }
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      시작하기
    </button>
  );
}
