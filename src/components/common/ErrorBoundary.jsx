import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" className="p-6 rounded-3xl bg-red-500/10">
          خطایی رخ داده است.
        </div>
      );
    }

    return this.props.children;
  }
}
