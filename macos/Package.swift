// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "context",
  platforms: [.macOS(.v15)],
  products: [
    .library(name: "ContextCore", targets: ["ContextCore"]),
    .executable(name: "Context", targets: ["Context"]),
    .executable(name: "ContextCoreSmoke", targets: ["ContextCoreSmoke"]),
  ],
  targets: [
    .target(
      name: "ContextCore",
      path: "Sources/ContextCore"
    ),
    .executableTarget(
      name: "Context",
      dependencies: ["ContextCore"],
      path: "Sources/Context"
    ),
    // CLT-friendly checks when Xcode/XCTest is unavailable.
    .executableTarget(
      name: "ContextCoreSmoke",
      dependencies: ["ContextCore"],
      path: "Sources/ContextCoreSmoke"
    ),
    .testTarget(
      name: "ContextCoreTests",
      dependencies: ["ContextCore"],
      path: "Tests/ContextCoreTests"
    ),
  ]
)
