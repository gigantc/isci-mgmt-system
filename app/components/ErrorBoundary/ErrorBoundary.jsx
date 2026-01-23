import { Component } from "react";
import styles from "./ErrorBoundary.module.scss";

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire application.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({ errorInfo });

    // TODO: Send to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <h1>Something went wrong</h1>
            <p>We're sorry, but something unexpected happened.</p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className={styles.errorActions}>
              <button
                className="btn-secondary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="btn-primary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
