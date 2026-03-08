"use client"
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">エラーが発生しました</h2>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "予期しないエラーが発生しました"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="text-sm underline text-primary"
            >
              再試行
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
