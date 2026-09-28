import ContextCore

/// Stand-in forecast until a real weather source is wired up.
struct WeatherStub: Sendable, Equatable {
  var temperature: Int
  var symbol: String

  var label: String { "\(temperature)°" }

  static let current = WeatherStub(temperature: 72, symbol: "sun.max.fill")
}
