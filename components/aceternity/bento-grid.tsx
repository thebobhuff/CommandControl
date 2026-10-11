// Adapted from Aceternity UI: https://ui.aceternity.com/components/bento-grid
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[21rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/50",
        className,
      )}
    >
      {header}
      <div className="transition duration-200">
        {icon}
        <div className="mt-3 mb-2 font-display text-3xl font-semibold text-foreground">
          {title}
        </div>
        <div className="text-sm leading-6 text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
};
