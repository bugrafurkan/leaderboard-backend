# This script assigns a random score between 0 and 10000
# to each player (using player id as the member) in the Redis sorted set "leaderboard:currentWeek".


# Loop from 1 to 150 (for 150 players)
for ($i = 16; $i -le 50; $i++) {
    # Generate a random score between 0 and 10000
    $score = Get-Random -Minimum 0 -Maximum 10001

    # Use the player id (numeric) as the member
    $playerId = $i

    # Execute the redis-cli ZADD command inside the Redis pod (using one of the cluster nodes)
    # Note: Adjust the pod name if needed.
    kubectl exec -it redis-cluster-0 -- redis-cli -c ZADD leaderboard:currentWeek $score $playerId

    Write-Host "Added playerId $playerId with score $score to leaderboard:currentWeek"
}
