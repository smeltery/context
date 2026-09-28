import XCTest

@testable import ContextCore

final class SystemLoadTests: XCTestCase {
  func testCPUPercentUsesBusyShareOfTheTickDelta() {
    let first = CPUTicks(user: 100, system: 50, idle: 850, nice: 0)
    let second = CPUTicks(user: 200, system: 100, idle: 1700, nice: 0)
    XCTAssertEqual(cpuPercent(from: first, to: second), 15, accuracy: 0.0001)
  }

  func testCPUPercentIsZeroWhenCountersStallOrReset() {
    let ticks = CPUTicks(user: 10, system: 10, idle: 80, nice: 0)
    XCTAssertEqual(cpuPercent(from: ticks, to: ticks), 0)

    let reset = CPUTicks(user: 1, system: 1, idle: 8, nice: 0)
    XCTAssertEqual(cpuPercent(from: ticks, to: reset), 0)
  }

  func testMemoryPercentAndFormatting() {
    XCTAssertEqual(memoryPercent(usedBytes: 8, totalBytes: 32), 25)
    XCTAssertEqual(memoryPercent(usedBytes: 8, totalBytes: 0), 0)

    let load = SystemLoad(cpuPercent: 42.6, memoryPercent: 99.4)
    XCTAssertEqual(load.cpuLabel, "43")
    XCTAssertEqual(load.memoryLabel, "99")
    XCTAssertEqual(SystemLoad.clampPercent(-5), 0)
    XCTAssertEqual(SystemLoad.clampPercent(.nan), 0)
  }

  func testPaletteAndSettingsDefaults() {
    XCTAssertEqual(DockPalette.resolve(.system, systemIsDark: false), .light)
    XCTAssertEqual(DockPalette.resolve(.light, systemIsDark: true), .light)
    XCTAssertEqual(DockColor(hex: 0xFFFFFF).red, 1)

    let storage = InMemorySettingsStorage()
    XCTAssertNil(storage.loadSettings())
    storage.saveSettings(DockSettings(edge: .left, autoHide: true))
    XCTAssertEqual(storage.loadSettings()?.edge, .left)
    XCTAssertEqual(DockSettings.default.edge, .right)
  }
}
