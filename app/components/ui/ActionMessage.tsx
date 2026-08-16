import { Alert } from './Alert';

interface ActionMessageProps {
  /**
   * Whatever the route action returned. Deliberately loose: actions in this app
   * return `{ error }` or `{ success, message }` shapes that vary slightly.
   */
  actionData?: { error?: string; success?: boolean; message?: string } | null;
  className?: string;
}

/**
 * Renders the error/success banner returned by a route action.
 *
 * The same pair of divs was written out verbatim in ~8 routes --
 *   {actionData?.error && <div className="mb-6 text-red-600 text-sm bg-red-50 ...">}
 * -- duplicating what Alert already does, but with a different radius and no
 * icon. This routes them through Alert so there is one presentation.
 *
 * role=alert so the message is announced rather than silently appearing.
 */
export function ActionMessage({ actionData, className = 'mb-6' }: ActionMessageProps) {
  if (!actionData) return null;

  if (actionData.error) {
    return (
      <div role="alert" className={className}>
        <Alert variant="error">{actionData.error}</Alert>
      </div>
    );
  }

  if (actionData.success && actionData.message) {
    return (
      <div role="status" className={className}>
        <Alert variant="success">{actionData.message}</Alert>
      </div>
    );
  }

  return null;
}
