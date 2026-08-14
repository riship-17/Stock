import { Package } from 'lucide-react';

/**
 * EmptyState — shown when there's no data with a clear CTA.
 */
export default function EmptyState({ icon: Icon = Package, imageSrc, title, description, action, actionLabel }) {
  return (
    <div className="empty-state">
      {imageSrc ? (
        <img src={imageSrc} alt="Empty State" className="w-48 h-48 object-contain mb-4 opacity-90 rounded-2xl" />
      ) : (
        <div className="empty-state-icon">
          <Icon size={32} strokeWidth={2.5} />
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && actionLabel && (
        <button className="btn btn-primary" onClick={action} id="empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
