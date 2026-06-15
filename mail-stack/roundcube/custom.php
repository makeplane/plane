<?php
/**
 * Extra Roundcube config merged on top of the env-derived config.inc.php.
 *
 * In local mode (no public domain) Postfix and Dovecot present a self-signed
 * certificate, so the internal webmail -> mail-server TLS connections must not
 * verify the peer. In production the Caddy/Let's Encrypt cert is valid, but
 * since these connections stay on the internal Docker network, relaxing peer
 * verification here is acceptable and keeps a single config for both modes.
 */

$config['imap_conn_options'] = [
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ],
];

$config['smtp_conn_options'] = [
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ],
];

// Allow embedding the webmail inside the Gizmo god-mode panel via <iframe>
// (Roundcube otherwise sends X-Frame-Options: sameorigin and blocks it).
$config['x_frame_options'] = false;

