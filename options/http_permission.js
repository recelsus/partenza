function build_http_origin_permission(url) {
    const parsed_url = new URL(url);

    if (parsed_url.protocol !== "http:" && parsed_url.protocol !== "https:") {
        throw new Error("Only http and https URLs are supported");
    }

    return `${parsed_url.origin}/*`;
}

function contains_permission(permission) {
    return chrome.permissions.contains({
        origins: [permission]
    });
}

function request_permission(permission) {
    return chrome.permissions.request({
        origins: [permission]
    });
}

export async function ensure_http_origin_permission(url) {
    const permission = build_http_origin_permission(url);
    const already_granted = await contains_permission(permission);

    if (already_granted) {
        return permission;
    }

    const granted = await request_permission(permission);

    if (!granted) {
        throw new Error("HTTP origin permission was not granted");
    }

    return permission;
}
