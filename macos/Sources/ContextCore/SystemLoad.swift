/// Cumulative CPU tick counters, as reported by `host_statistics`.
public struct CPUTicks: Sendable, Equatable {
  public var user: UInt64
  public var system: UInt64
  public var idle: UInt64
  public var nice: UInt64

  public init(user: UInt64, system: UInt64, idle: UInt64, nice: UInt64) {
    self.user = user
    self.system = system
    self.idle = idle
    self.nice = nice
  }

  public var total: UInt64 { user &+ system &+ idle &+ nice }
  public var busy: UInt64 { user &+ system &+ nice }
}

/// A CPU / memory sample rendered by the stats cell.
public struct SystemLoad: Sendable, Equatable {
  public var cpuPercent: Double
  public var memoryPercent: Double

  public init(cpuPercent: Double = 0, memoryPercent: Double = 0) {
    self.cpuPercent = cpuPercent
    self.memoryPercent = memoryPercent
  }

  public var cpuLabel: String { SystemLoad.formatPercent(cpuPercent) }
  public var memoryLabel: String { SystemLoad.formatPercent(memoryPercent) }

  /// Renders a percentage as an integer with no unit, e.g. `"42"`.
  public static func formatPercent(_ value: Double) -> String {
    String(Int(clampPercent(value).rounded()))
  }

  public static func clampPercent(_ value: Double) -> Double {
    guard value.isFinite else { return 0 }
    return min(100, max(0, value))
  }
}

/// Busy share between two tick samples, as a percentage.
///
/// Returns 0 when the counters did not advance or went backwards, which happens
/// on the first sample and across counter resets.
public func cpuPercent(from previous: CPUTicks, to current: CPUTicks) -> Double {
  guard current.total > previous.total, current.busy >= previous.busy else { return 0 }
  let totalDelta = Double(current.total - previous.total)
  let busyDelta = Double(current.busy - previous.busy)
  return SystemLoad.clampPercent(busyDelta / totalDelta * 100)
}

/// Memory pressure as a share of physical memory in use.
public func memoryPercent(usedBytes: UInt64, totalBytes: UInt64) -> Double {
  guard totalBytes > 0 else { return 0 }
  return SystemLoad.clampPercent(Double(usedBytes) / Double(totalBytes) * 100)
}
