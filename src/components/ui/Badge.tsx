import styles from './Badge.module.css';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ variant = 'default', children, className = '', style }: BadgeProps) {
  const variantClass = styles[variant];

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
}
