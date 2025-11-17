# --- Claude Code AWS Bedrock Setup ---
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

$Env:CLAUDE_CODE_USE_BEDROCK = "1"
$Env:AWS_REGION = "us-west-2"
$Env:AWS_DEFAULT_REGION = $Env:AWS_REGION
$Env:AWS_PROFILE = "bedrock"
$Env:ANTHROPIC_DEFAULT_SONNET_MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
$Env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

if (-not $Env:AWS_BEARER_TOKEN_BEDROCK) {
    throw "AWS_BEARER_TOKEN_BEDROCK is not set. Use the AWS Bedrock bearer token from the console and store it as a user environment variable before launching Claude Code."
}

Write-Host "AWS Bedrock environment configured for Claude Code."
Write-Host "Launching VS Code in project folder..."

code $projectPath
