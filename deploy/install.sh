#!/bin/bash
#
# FictionGPT Installation Script
# FictionGPT 安装脚本
# Usage: curl -sSL https://raw.githubusercontent.com/ijk0/FictionGPT/main/deploy/install.sh | sudo bash
# Background (recommended for low-memory VPS):
#   AUTH_TOKEN=xxx ANTHROPIC_BASE_URL=xxx ANTHROPIC_AUTH_TOKEN=xxx \
#     bash -c 'curl -sSL https://raw.githubusercontent.com/ijk0/FictionGPT/main/deploy/install.sh | sudo -E bash' \
#     > /tmp/fictiongpt-install.log 2>&1 & disown
#   tail -f /tmp/fictiongpt-install.log
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
GITHUB_REPO="ijk0/FictionGPT"
INSTALL_DIR="/opt/fictiongpt"
SERVICE_NAME="fictiongpt"
SERVICE_USER="fictiongpt"
DATA_DIR="/opt/fictiongpt/data"
NODE_VERSION="20"

# Server configuration: env vars > existing .env.local > defaults
SERVER_PORT="${SERVER_PORT:-3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-}"
ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-}"

# ============================================================
# Messages
# ============================================================

declare -A MSG=(
    ["info"]="信息"
    ["success"]="成功"
    ["warning"]="警告"
    ["error"]="错误"
    ["install_title"]="FictionGPT 安装脚本"
    ["run_as_root"]="请使用 root 权限运行 (使用 sudo)"
    ["detected_platform"]="检测到平台"
    ["unsupported_os"]="不支持的操作系统，仅支持 Linux"
    ["missing_deps"]="缺少依赖"
    ["install_deps_first"]="请先安装以下依赖"
    ["checking_node"]="正在检查 Node.js..."
    ["node_found"]="Node.js 已安装"
    ["installing_node"]="正在安装 Node.js ${NODE_VERSION}..."
    ["node_installed"]="Node.js 安装完成"
    ["cloning_repo"]="正在克隆仓库..."
    ["clone_complete"]="仓库克隆完成"
    ["pulling_updates"]="正在拉取最新代码..."
    ["pull_complete"]="代码更新完成"
    ["installing_deps"]="正在安装依赖..."
    ["deps_installed"]="依赖安装完成"
    ["building"]="正在构建项目..."
    ["build_complete"]="构建完成"
    ["creating_user"]="正在创建系统用户"
    ["user_exists"]="用户已存在"
    ["user_created"]="用户已创建"
    ["setting_up_dirs"]="正在设置目录..."
    ["dirs_configured"]="目录配置完成"
    ["writing_env"]="正在写入环境配置..."
    ["env_written"]="环境配置已写入"
    ["installing_service"]="正在安装 systemd 服务..."
    ["service_installed"]="systemd 服务已安装"
    ["starting_service"]="正在启动服务..."
    ["service_started"]="服务已启动"
    ["service_start_failed"]="服务启动失败，请检查日志"
    ["enabling_autostart"]="正在设置开机自启..."
    ["autostart_enabled"]="开机自启已启用"
    ["stopping_service"]="正在停止服务..."
    ["install_complete"]="FictionGPT 安装完成！"
    ["upgrade_complete"]="FictionGPT 升级完成！"
    ["uninstall_confirm"]="这将从系统中移除 FictionGPT。"
    ["are_you_sure"]="确定要继续吗？(y/N)"
    ["uninstall_cancelled"]="卸载已取消"
    ["uninstall_complete"]="FictionGPT 已卸载"
    ["keep_data_prompt"]="是否保留数据目录 (项目数据)？[Y/n]: "
    ["data_kept"]="数据目录已保留"
    ["data_removed"]="数据目录已删除"
    ["config_title"]="服务配置"
    ["port_prompt"]="服务端口"
    ["port_hint"]="建议使用 1024-65535 之间的端口"
    ["invalid_port"]="无效端口号，请输入 1-65535 之间的数字"
    ["auth_token_prompt"]="访问令牌 (用于登录验证)"
    ["auth_token_hint"]="设置一个密码，用户需要输入此令牌才能访问站点"
    ["anthropic_url_prompt"]="Anthropic API Base URL"
    ["anthropic_url_hint"]="例如: https://api.anthropic.com 或代理地址"
    ["anthropic_token_prompt"]="Anthropic API Token"
    ["anthropic_token_hint"]="你的 Anthropic API 密钥"
    ["getting_public_ip"]="正在获取公网 IP..."
    ["public_ip_failed"]="无法获取公网 IP，使用本地 IP"
)

# Print functions
print_info() {
    echo -e "${BLUE}[${MSG[info]}]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[${MSG[success]}]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[${MSG[warning]}]${NC} $1"
}

print_error() {
    echo -e "${RED}[${MSG[error]}]${NC} $1"
}

# Check if running interactively
is_interactive() {
    [ -e /dev/tty ] && [ -r /dev/tty ] && [ -w /dev/tty ]
}

# Validate port number
validate_port() {
    local port="$1"
    if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ]; then
        return 0
    fi
    return 1
}

# Ensure root privileges (re-exec with sudo if needed)
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        if command -v sudo &> /dev/null; then
            if [ -f "$0" ]; then
                print_info "需要 root 权限，使用 sudo 提权..."
                exec sudo -E bash "$0" "${ORIG_ARGS[@]}"
            else
                print_error "通过管道运行时请使用 sudo: curl ... | sudo bash"
                exit 1
            fi
        else
            print_error "${MSG[run_as_root]}"
            exit 1
        fi
    fi
}

# Detect OS
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        linux)
            ;;
        *)
            print_error "${MSG[unsupported_os]}: $OS"
            exit 1
            ;;
    esac

    print_info "${MSG[detected_platform]}: ${OS} ${ARCH}"
}

# Check dependencies
check_dependencies() {
    local missing=()

    for cmd in curl git; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "${MSG[missing_deps]}: ${missing[*]}"
        print_info "${MSG[install_deps_first]}"
        exit 1
    fi
}

# Install or check Node.js
setup_node() {
    print_info "${MSG[checking_node]}"

    if command -v node &> /dev/null; then
        local node_ver
        node_ver=$(node -v | grep -oE '[0-9]+' | head -1)
        if [ "$node_ver" -ge "$NODE_VERSION" ]; then
            print_success "${MSG[node_found]}: $(node -v)"
            return
        fi
    fi

    print_info "${MSG[installing_node]}"

    # Install Node.js via NodeSource
    if command -v apt-get &> /dev/null; then
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | bash -
        yum install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | bash -
        dnf install -y nodejs
    else
        print_error "无法自动安装 Node.js，请手动安装 Node.js >= ${NODE_VERSION}"
        exit 1
    fi

    print_success "${MSG[node_installed]}: $(node -v)"
}

# Load existing .env.local values as fallback
load_existing_env() {
    local env_file="$INSTALL_DIR/.env.local"
    if [ -f "$env_file" ]; then
        print_info "检测到已有配置文件，读取现有配置..."
        local val
        val=$(grep -E '^ANTHROPIC_BASE_URL=' "$env_file" 2>/dev/null | cut -d= -f2- || true)
        [ -z "$ANTHROPIC_BASE_URL" ] && [ -n "$val" ] && ANTHROPIC_BASE_URL="$val"
        val=$(grep -E '^ANTHROPIC_AUTH_TOKEN=' "$env_file" 2>/dev/null | cut -d= -f2- || true)
        [ -z "$ANTHROPIC_AUTH_TOKEN" ] && [ -n "$val" ] && ANTHROPIC_AUTH_TOKEN="$val"
        val=$(grep -E '^AUTH_TOKEN=' "$env_file" 2>/dev/null | cut -d= -f2- || true)
        [ -z "$AUTH_TOKEN" ] && [ -n "$val" ] && AUTH_TOKEN="$val"
    fi
}

# Configure server settings
configure_server() {
    load_existing_env

    if ! is_interactive; then
        # Non-interactive: use env vars / existing config / defaults
        if [ -z "$AUTH_TOKEN" ]; then
            print_error "非交互模式下必须设置 AUTH_TOKEN 环境变量（或已有 .env.local）"
            print_info "用法: AUTH_TOKEN=xxx ANTHROPIC_BASE_URL=xxx ANTHROPIC_AUTH_TOKEN=xxx bash install.sh"
            exit 1
        fi
        print_info "非交互模式: 端口 ${SERVER_PORT} | 令牌 ${AUTH_TOKEN:0:4}****"
        return
    fi

    echo ""
    echo -e "${CYAN}=============================================="
    echo "  ${MSG[config_title]}"
    echo "==============================================${NC}"
    echo ""

    # Port
    echo -e "${YELLOW}${MSG[port_hint]}${NC}"
    while true; do
        read -p "${MSG[port_prompt]} [${SERVER_PORT}]: " input_port < /dev/tty
        if [ -z "$input_port" ]; then
            break
        elif validate_port "$input_port"; then
            SERVER_PORT="$input_port"
            break
        else
            print_error "${MSG[invalid_port]}"
        fi
    done
    echo ""

    # Auth token
    echo -e "${YELLOW}${MSG[auth_token_hint]}${NC}"
    while true; do
        read -p "${MSG[auth_token_prompt]}: " AUTH_TOKEN < /dev/tty
        if [ -n "$AUTH_TOKEN" ]; then
            break
        fi
        print_error "访问令牌不能为空"
    done
    echo ""

    # Anthropic Base URL
    echo -e "${YELLOW}${MSG[anthropic_url_hint]}${NC}"
    read -p "${MSG[anthropic_url_prompt]}: " ANTHROPIC_BASE_URL < /dev/tty
    echo ""

    # Anthropic Token
    echo -e "${YELLOW}${MSG[anthropic_token_hint]}${NC}"
    read -p "${MSG[anthropic_token_prompt]}: " ANTHROPIC_AUTH_TOKEN < /dev/tty
    echo ""

    print_info "端口: ${SERVER_PORT} | 令牌: ${AUTH_TOKEN:0:4}****"
}

# Create system user
create_user() {
    if id "$SERVICE_USER" &>/dev/null; then
        print_info "${MSG[user_exists]}: $SERVICE_USER"
    else
        print_info "${MSG[creating_user]} $SERVICE_USER..."
        useradd -r -s /bin/false -d "$INSTALL_DIR" -m "$SERVICE_USER"
        print_success "${MSG[user_created]}"
    fi
}

# Clone or update repository
clone_or_update_repo() {
    if [ -d "$INSTALL_DIR/.git" ]; then
        print_info "${MSG[pulling_updates]}"
        cd "$INSTALL_DIR"
        git fetch --all
        git reset --hard origin/main
        print_success "${MSG[pull_complete]}"
    else
        print_info "${MSG[cloning_repo]}"
        mkdir -p "$INSTALL_DIR"

        # Clone into a temp dir then move contents (in case INSTALL_DIR exists)
        local tmpdir
        tmpdir=$(mktemp -d)
        git clone --depth 1 "https://github.com/${GITHUB_REPO}.git" "$tmpdir"
        cp -a "$tmpdir/." "$INSTALL_DIR/"
        rm -rf "$tmpdir"

        print_success "${MSG[clone_complete]}"
    fi
}

# Ensure swap exists (critical for low-memory VPS, e.g. 1GB)
ensure_swap() {
    local total_mem_kb
    total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_mem_mb=$((total_mem_kb / 1024))

    # Only create swap if total RAM <= 2GB and no swap exists
    if [ "$total_mem_mb" -le 2048 ]; then
        local current_swap_kb
        current_swap_kb=$(grep SwapTotal /proc/meminfo | awk '{print $2}')

        local current_swap_mb=$((current_swap_kb / 1024))

        if [ "$current_swap_mb" -lt 1024 ]; then
            local swap_size_mb=$((2048 - total_mem_mb - current_swap_mb + 512))
            [ "$swap_size_mb" -lt 1024 ] && swap_size_mb=1024

            print_info "内存不足 (RAM: ${total_mem_mb}MB, Swap: ${current_swap_mb}MB)，正在创建 ${swap_size_mb}MB 交换文件..."

            local swapfile="/swapfile"
            # Disable existing small swap if we're replacing it
            if [ -f "$swapfile" ]; then
                swapoff "$swapfile" 2>/dev/null || true
                rm -f "$swapfile"
            fi
            dd if=/dev/zero of="$swapfile" bs=1M count="$swap_size_mb" status=progress
            chmod 600 "$swapfile"
            mkswap "$swapfile"
            swapon "$swapfile"

            # Persist across reboots
            if ! grep -q "$swapfile" /etc/fstab 2>/dev/null; then
                echo "$swapfile none swap sw 0 0" >> /etc/fstab
            fi

            print_success "交换文件已创建并启用 (${swap_size_mb}MB)"
        else
            print_info "交换空间已充足 (${current_swap_mb}MB)"
        fi
    fi
}

# Install npm dependencies and build
build_project() {
    cd "$INSTALL_DIR"

    # Ensure enough memory for build
    ensure_swap

    # Limit Node.js heap for low-memory environments
    local total_mem_kb
    total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_mem_mb=$((total_mem_kb / 1024))
    if [ "$total_mem_mb" -le 2048 ]; then
        local heap_size=$((total_mem_mb / 2))
        [ "$heap_size" -lt 256 ] && heap_size=256
        [ "$heap_size" -gt 512 ] && heap_size=512
        export NODE_OPTIONS="--max-old-space-size=${heap_size}"
        print_info "低内存模式: Node.js 堆限制为 ${heap_size}MB"
    fi

    print_info "${MSG[installing_deps]}"
    npm ci --production=false
    print_success "${MSG[deps_installed]}"

    print_info "${MSG[building]}"
    npm run build
    print_success "${MSG[build_complete]}"

    # Clean up NODE_OPTIONS
    unset NODE_OPTIONS
}

# Setup directories and permissions
setup_directories() {
    print_info "${MSG[setting_up_dirs]}"

    mkdir -p "$DATA_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

    print_success "${MSG[dirs_configured]}"
}

# Write .env.local
write_env() {
    print_info "${MSG[writing_env]}"

    local env_file="$INSTALL_DIR/.env.local"

    # Preserve existing values if upgrading
    if [ -f "$env_file" ]; then
        # Read existing values as defaults
        local existing_url existing_token existing_auth
        existing_url=$(grep -E '^ANTHROPIC_BASE_URL=' "$env_file" 2>/dev/null | cut -d= -f2- || true)
        existing_token=$(grep -E '^ANTHROPIC_AUTH_TOKEN=' "$env_file" 2>/dev/null | cut -d= -f2- || true)
        existing_auth=$(grep -E '^AUTH_TOKEN=' "$env_file" 2>/dev/null | cut -d= -f2- || true)

        [ -z "$ANTHROPIC_BASE_URL" ] && ANTHROPIC_BASE_URL="$existing_url"
        [ -z "$ANTHROPIC_AUTH_TOKEN" ] && ANTHROPIC_AUTH_TOKEN="$existing_token"
        [ -z "$AUTH_TOKEN" ] && AUTH_TOKEN="$existing_auth"
    fi

    cat > "$env_file" << EOF
ANTHROPIC_BASE_URL=${ANTHROPIC_BASE_URL}
ANTHROPIC_AUTH_TOKEN=${ANTHROPIC_AUTH_TOKEN}
AUTH_TOKEN=${AUTH_TOKEN}
EOF

    chown "$SERVICE_USER:$SERVICE_USER" "$env_file"
    chmod 600 "$env_file"

    print_success "${MSG[env_written]}"
}

# Install systemd service
install_service() {
    print_info "${MSG[installing_service]}"

    cat > /etc/systemd/system/fictiongpt.service << EOF
[Unit]
Description=FictionGPT - AI Novel Creation Platform
Documentation=https://github.com/${GITHUB_REPO}
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=$(command -v node) ${INSTALL_DIR}/node_modules/.bin/next start -p ${SERVER_PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fictiongpt

# Environment
Environment=NODE_ENV=production
Environment=PORT=${SERVER_PORT}

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=${INSTALL_DIR}

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload

    print_success "${MSG[service_installed]}"
}

# Start service
start_service() {
    print_info "${MSG[starting_service]}"

    if systemctl start fictiongpt; then
        print_success "${MSG[service_started]}"
        return 0
    else
        print_error "${MSG[service_start_failed]}"
        print_info "sudo journalctl -u fictiongpt -n 50"
        return 1
    fi
}

# Enable auto-start
enable_autostart() {
    print_info "${MSG[enabling_autostart]}"

    if systemctl enable fictiongpt 2>/dev/null; then
        print_success "${MSG[autostart_enabled]}"
    fi
}

# Get public IP
get_public_ip() {
    print_info "${MSG[getting_public_ip]}"

    local response
    response=$(curl -s --connect-timeout 5 --max-time 10 "https://ipinfo.io/json" 2>/dev/null)

    if [ -n "$response" ]; then
        PUBLIC_IP=$(echo "$response" | grep -o '"ip": *"[^"]*"' | sed 's/"ip": *"\([^"]*\)"/\1/')
        if [ -n "$PUBLIC_IP" ]; then
            print_success "公网 IP: $PUBLIC_IP"
            return 0
        fi
    fi

    print_warning "${MSG[public_ip_failed]}"
    PUBLIC_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")
}

# Print completion message
print_completion() {
    local display_host="${PUBLIC_IP:-YOUR_SERVER_IP}"

    echo ""
    echo "=============================================="
    print_success "${MSG[install_complete]}"
    echo "=============================================="
    echo ""
    echo "  安装目录: $INSTALL_DIR"
    echo "  数据目录: $DATA_DIR"
    echo "  服务端口: $SERVER_PORT"
    echo ""
    echo "=============================================="
    echo "  访问地址"
    echo "=============================================="
    echo ""
    echo "     http://${display_host}:${SERVER_PORT}"
    echo ""
    echo "     使用你设置的访问令牌登录"
    echo ""
    echo "=============================================="
    echo "  常用命令"
    echo "=============================================="
    echo ""
    echo "  查看状态:   sudo systemctl status fictiongpt"
    echo "  查看日志:   sudo journalctl -u fictiongpt -f"
    echo "  重启服务:   sudo systemctl restart fictiongpt"
    echo "  停止服务:   sudo systemctl stop fictiongpt"
    echo ""
    echo "  升级:       curl -sSL https://raw.githubusercontent.com/${GITHUB_REPO}/main/deploy/install.sh | bash -s -- upgrade"
    echo "  卸载:       curl -sSL https://raw.githubusercontent.com/${GITHUB_REPO}/main/deploy/install.sh | bash -s -- uninstall"
    echo ""
    echo "=============================================="
}

# Upgrade function
upgrade() {
    if [ ! -d "$INSTALL_DIR/.git" ]; then
        print_error "FictionGPT 尚未安装，请先执行全新安装"
        exit 1
    fi

    print_info "正在升级 FictionGPT..."

    # Stop service
    if systemctl is-active --quiet fictiongpt; then
        print_info "${MSG[stopping_service]}"
        systemctl stop fictiongpt
    fi

    # Update code
    clone_or_update_repo

    # Rebuild
    build_project

    # Fix permissions
    setup_directories

    # Preserve env
    write_env

    # Reinstall service (port may have changed)
    install_service

    # Start
    start_service

    echo ""
    echo "=============================================="
    print_success "${MSG[upgrade_complete]}"
    echo "=============================================="
    echo ""
}

# Uninstall function
uninstall() {
    print_warning "${MSG[uninstall_confirm]}"

    if ! is_interactive; then
        if [ "${FORCE_YES:-}" != "true" ]; then
            print_error "非交互模式，请使用 -y 参数确认"
            exit 1
        fi
    else
        read -p "${MSG[are_you_sure]} " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "${MSG[uninstall_cancelled]}"
            exit 0
        fi
    fi

    # Stop and disable service
    print_info "${MSG[stopping_service]}"
    systemctl stop fictiongpt 2>/dev/null || true
    systemctl disable fictiongpt 2>/dev/null || true
    rm -f /etc/systemd/system/fictiongpt.service
    systemctl daemon-reload

    # Ask about data
    local remove_data=false
    if [ "${PURGE:-}" = "true" ]; then
        remove_data=true
    elif is_interactive; then
        read -p "${MSG[keep_data_prompt]}" -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            remove_data=true
        fi
    fi

    if [ "$remove_data" = true ]; then
        rm -rf "$INSTALL_DIR"
        print_info "${MSG[data_removed]}"
    else
        # Remove everything except data/
        find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' ! -name '.env.local' -exec rm -rf {} +
        print_info "${MSG[data_kept]}: $DATA_DIR"
    fi

    # Remove user
    userdel "$SERVICE_USER" 2>/dev/null || true

    print_success "${MSG[uninstall_complete]}"
}

# Help
show_help() {
    echo "用法: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  (无参数)       全新安装 FictionGPT"
    echo "  install        全新安装 FictionGPT"
    echo "  upgrade        升级到最新版本"
    echo "  uninstall      卸载 FictionGPT"
    echo ""
    echo "Options:"
    echo "  -y, --yes      跳过确认提示"
    echo "  --purge        卸载时同时删除所有数据"
    echo ""
    echo "Examples:"
    echo "  $0                    # 全新安装"
    echo "  $0 upgrade            # 升级到最新版本"
    echo "  $0 uninstall          # 卸载（保留数据）"
    echo "  $0 uninstall --purge  # 卸载（删除所有数据）"
    echo ""
}

# Main
main() {
    # Save original args for sudo re-exec
    ORIG_ARGS=("$@")

    # Parse flags
    local positional_args=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -y|--yes)
                FORCE_YES="true"
                shift
                ;;
            --purge)
                PURGE="true"
                shift
                ;;
            *)
                positional_args+=("$1")
                shift
                ;;
        esac
    done

    set -- "${positional_args[@]}"

    echo ""
    echo -e "${CYAN}=============================================="
    echo "       ${MSG[install_title]}"
    echo "==============================================${NC}"
    echo ""

    case "${1:-}" in
        upgrade|update)
            check_root
            detect_platform
            check_dependencies
            upgrade
            exit 0
            ;;
        uninstall|remove)
            check_root
            uninstall
            exit 0
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        install|"")
            # Fresh install
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac

    # Fresh install
    check_root
    detect_platform
    check_dependencies
    setup_node
    configure_server
    create_user
    clone_or_update_repo
    build_project
    setup_directories
    write_env
    install_service
    get_public_ip
    start_service
    enable_autostart
    print_completion
}

main "$@"
