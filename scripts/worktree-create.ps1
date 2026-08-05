#Requires -Version 5.1
<#
.SYNOPSIS
  Create an isolated git worktree for parallel agent development.
.PARAMETER TaskId
  Task identifier (e.g. TASK-001)
.PARAMETER Agent
  Agent identifier: p1 or p2
.PARAMETER Description
  Short branch description (default: task)
.EXAMPLE
  .\scripts\worktree-create.ps1 -TaskId TASK-001 -Agent p1 -Description nextjs-scaffold
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $TaskId,

  [Parameter(Mandatory = $true)]
  [ValidateSet('p1', 'p2')]
  [string] $Agent,

  [string] $Description = 'task'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Branch = "feature/$TaskId-$Description"
$WorktreePath = Join-Path (Split-Path -Parent $RepoRoot) "buildlearn-wt-$TaskId-$Agent"

Set-Location $RepoRoot

$branchExists = git show-ref --verify --quiet "refs/heads/$Branch" 2>$null
if ($LASTEXITCODE -ne 0) {
  git branch $Branch main
  Write-Host "Created branch: $Branch"
} else {
  Write-Host "Branch already exists: $Branch"
}

if (Test-Path $WorktreePath) {
  Write-Host "Worktree already exists: $WorktreePath"
} else {
  git worktree add $WorktreePath $Branch
  Write-Host "Created worktree: $WorktreePath"
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  cd $WorktreePath"
Write-Host "  # Open this directory in a new Cursor agent session"
Write-Host "  # Implement task $TaskId as Programmer $Agent"
