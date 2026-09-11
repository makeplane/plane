param()
$payload = $input | Out-String | ConvertFrom-Json

# Emit a decision in BOTH hook-output dialects: the top-level
# permissionDecision (Claude Code's classic format) AND the
# hookSpecificOutput block (the DSH hook codec's format — the top-level
# field alone is ignored there, and the hookEventName must match the
# firing point or the block is discarded). The event name is echoed from
# the payload so both harnesses decode the same decision.
function Write-Decision {
    param(
        [string]$Decision,
        [string]$Reason
    )
    $hookEventName = if ($payload.hook_event_name) { $payload.hook_event_name } else { "PreToolUse" }
    @{
        permissionDecision = $Decision
        permissionDecisionReason = $Reason
        hookSpecificOutput = @{
            hookEventName = $hookEventName
            permissionDecision = $Decision
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Compress -Depth 5
}

$toolName = $payload.tool_name
$filePath = $null

if ($toolName -eq "NotebookEdit") {
    $filePath = $payload.tool_input.notebook_path
} else {
    $filePath = $payload.tool_input.file_path
}

if (-not $filePath) {
    Write-Decision -Decision "allow" -Reason ""
    return
}

# Normalize separators for matching
$norm = $filePath -replace "\\", "/"
$basenameFull = [System.IO.Path]::GetFileName($norm)
$basenameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($norm)
$ext = [System.IO.Path]::GetExtension($norm)

# -- Tier 1 exclusions (checked before the general .env block rule) --
$envExclusions = @(".env.example", ".env.sample", ".env.template")
$isEnvExclusion = $false
foreach ($excl in $envExclusions) {
    if ($basenameFull -ieq $excl) {
        $isEnvExclusion = $true
        break
    }
}

if (-not $isEnvExclusion) {
    # -- Tier 1: hard deny, no override --

    # .env or .env.* (not the exclusions above)
    if ($basenameFull -imatch "^\.env(\..+)?$") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern (.env). If you need to read this file, do so manually outside the harness."
        return
    }

    # .ssh/ or .ssh\ anywhere in the path
    if ($norm -imatch "(^|/)\.ssh/") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern (.ssh/ directory). If you need to read this file, do so manually outside the harness."
        return
    }

    # .aws/ or .aws\, or basename credentials/config under an .aws folder
    if ($norm -imatch "(^|/)\.aws/") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern (.aws/ directory). If you need to read this file, do so manually outside the harness."
        return
    }

    # .claude.json (exact home-level file) -- do NOT block .claude/settings.json
    if ($basenameFull -ieq ".claude.json") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern (.claude.json, contains session/OAuth tokens). If you need to read this file, do so manually outside the harness."
        return
    }

    # .pem, .key, .pfx extensions
    if ($ext -imatch "^\.(pem|key|pfx)$") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern ($ext extension). If you need to read this file, do so manually outside the harness."
        return
    }

    # default SSH key basenames
    if ($basenameNoExt -imatch "^(id_rsa|id_ed25519|id_ecdsa|id_dsa)$") {
        Write-Decision -Decision "deny" -Reason "Blocked by secrets-guard: path matches a credential/secret file pattern (default SSH key basename). If you need to read this file, do so manually outside the harness."
        return
    }
}

# -- Tier 2: ask for confirmation (heuristic filename match) --

if ($basenameFull -imatch "credentials") {
    Write-Decision -Decision "ask" -Reason "secrets-guard: filename heuristically matches a credential-file pattern ('credentials'). Confirm this is not an actual secrets file before proceeding."
    return
}

if ($basenameFull -imatch "secrets") {
    Write-Decision -Decision "ask" -Reason "secrets-guard: filename heuristically matches a credential-file pattern ('secrets'). Confirm this is not an actual secrets file before proceeding."
    return
}

# -- Otherwise: allow --
Write-Decision -Decision "allow" -Reason ""
