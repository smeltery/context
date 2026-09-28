import ContextCore
import Darwin
import Foundation

/// Samples CPU ticks and memory usage from the Mach host.
enum SystemStatsReader {
  /// Cumulative host-wide CPU ticks, or `nil` if the kernel call fails.
  static func cpuTicks() -> CPUTicks? {
    var info = host_cpu_load_info()
    var count = mach_msg_type_number_t(
      MemoryLayout<host_cpu_load_info_data_t>.stride / MemoryLayout<integer_t>.stride
    )
    let status = withUnsafeMutablePointer(to: &info) { pointer in
      pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
        host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, rebound, &count)
      }
    }
    guard status == KERN_SUCCESS else { return nil }
    return CPUTicks(
      user: UInt64(info.cpu_ticks.0),
      system: UInt64(info.cpu_ticks.1),
      idle: UInt64(info.cpu_ticks.2),
      nice: UInt64(info.cpu_ticks.3)
    )
  }

  /// Bytes of physical memory in use and installed, or `nil` if unavailable.
  static func memoryUsage() -> (used: UInt64, total: UInt64)? {
    var stats = vm_statistics64()
    var count = mach_msg_type_number_t(
      MemoryLayout<vm_statistics64_data_t>.stride / MemoryLayout<integer_t>.stride
    )
    let status = withUnsafeMutablePointer(to: &stats) { pointer in
      pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
        host_statistics64(mach_host_self(), HOST_VM_INFO64, rebound, &count)
      }
    }
    guard status == KERN_SUCCESS else { return nil }

    // `sysconf` rather than the `vm_kernel_page_size` global, which Swift 6
    // rejects as shared mutable state.
    let pageSize = UInt64(max(0, sysconf(_SC_PAGESIZE)))
    let usedPages =
      UInt64(stats.active_count)
      + UInt64(stats.wire_count)
      + UInt64(stats.compressor_page_count)
    let total = ProcessInfo.processInfo.physicalMemory
    return (used: usedPages * pageSize, total: total)
  }
}
