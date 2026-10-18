using System.Collections.Concurrent;

namespace BusSolutionApi.Infrastructure;

// Locks a login key (IP, or phone+IP) after repeated failures. In-memory on purpose: a restart
// clears it, which is acceptable for a single-instance deployment per customer.
public class LoginThrottle
{
    public const int MaxFailures = 5;
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(15);

    private record State(int Failures, DateTime FirstFailure, DateTime? LockedUntil);
    private readonly ConcurrentDictionary<string, State> _states = new();

    public TimeSpan? RemainingLockout(string key)
    {
        if (!_states.TryGetValue(key, out var s) || s.LockedUntil is not { } until) return null;
        var left = until - DateTime.UtcNow;
        if (left > TimeSpan.Zero) return left;
        _states.TryRemove(key, out _);
        return null;
    }

    public void RecordFailure(string key)
    {
        var now = DateTime.UtcNow;
        _states.AddOrUpdate(key,
            _ => new State(1, now, null),
            (_, s) =>
            {
                if (now - s.FirstFailure > Window) return new State(1, now, null);
                var failures = s.Failures + 1;
                return new State(failures, s.FirstFailure, failures >= MaxFailures ? now + Window : null);
            });
    }

    public void RecordSuccess(string key) => _states.TryRemove(key, out _);
}
