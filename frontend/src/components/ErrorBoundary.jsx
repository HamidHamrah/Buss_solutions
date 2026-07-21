import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark mb-3">Noe gikk galt</h1>
            <p className="text-gray-500 mb-8">
              Vi beklager. En uventet feil oppstod. Prøv å laste siden på nytt, eller kontakt oss dersom problemet vedvarer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl text-sm transition-colors"
              >
                Last siden på nytt
              </button>
              <a
                href="/"
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Til forsiden
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
