#Requires -Version 5.1
param(
  [Parameter(Mandatory = $true)]
  [string] $TaskId,

  [Parameter(Mandatory = $true)]
  [ValidateSet('p1', 'p2')]
  [string] $Agent
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$WorktreePath = Join-Path (Split-Path -Parent $RepoRoot) "buildlearn-wt-$TaskId-$Agent"

Set-Location $RepoRoot

if (Test-Path $WorktreePath) {
  git worktree remove $WorktreePath --force
  Write-Host "Removed worktree: $WorktreePath"
} else {
  Write-Host "Worktree not found: $WorktreePath"
}
