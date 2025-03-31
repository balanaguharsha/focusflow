import subprocess
import sys
import os
import shutil
import json
import time
import platform # Import platform module
from pathlib import Path

# --- Configuration ---
DEFAULT_BUILD_DIR = "dist"  # Default build output directory if detection fails
DEPLOY_BRANCH = "gh-pages"  # Branch to deploy to

# --- Helper Functions ---

# Added platform detection
OS_NAME = platform.system().lower()

def suggest_installation(tool_name):
    """Prints suggested installation commands for missing tools based on OS."""
    print(f"\n--- Installation Suggestion for '{tool_name}' ---")
    print(f"(Detected OS: {OS_NAME})")

    handled = False
    if tool_name == 'git':
        handled = True
        if OS_NAME == 'linux':
            print("On Debian/Ubuntu: sudo apt update && sudo apt install git")
            print("On Fedora/CentOS/RHEL: sudo dnf install git  (or sudo yum install git)")
            print("Check your specific distribution's package manager.")
        elif OS_NAME == 'darwin': # macOS
            print("Install Xcode Command Line Tools (includes Git) or use Homebrew:")
            print("  xcode-select --install")
            print("  (Or using Homebrew: brew install git)")
        elif OS_NAME == 'windows':
            print("Download installer from: https://git-scm.com/download/win")
            print("Or use a package manager like Chocolatey or Scoop:")
            print("  choco install git.install")
            print("  scoop install git")
            print("Consider using Git Bash or WSL (Windows Subsystem for Linux).")
        else:
            handled = False # Fall through to generic message

    elif tool_name == 'gh':
        handled = True
        print("Please follow the official installation instructions for GitHub CLI:")
        print("  https://github.com/cli/cli#installation")
        # Provide common commands as examples
        if OS_NAME == 'linux': print("(Often involves adding a repository: see instructions for apt, dnf, etc.)")
        elif OS_NAME == 'darwin': print("  Using Homebrew: brew install gh")
        elif OS_NAME == 'windows': print("  Using Chocolatey: choco install gh")
        # Corrected duplicate condition for windows scoop
        elif OS_NAME == 'windows': print("  Using Scoop: scoop install gh")


    elif tool_name == 'node' or tool_name == 'npm': # npm comes with node
        handled = True
        print("Recommendation: Use a Node Version Manager like nvm or fnm.")
        print("  nvm (Linux/macOS): https://github.com/nvm-sh/nvm#installing-and-updating")
        print("  nvm-windows: https://github.com/coreybutler/nvm-windows#installation--upgrades")
        print("  fnm (cross-platform): https://github.com/Schniz/fnm")
        print("\nAlternatively, download directly from: https://nodejs.org/")
        if OS_NAME == 'linux': print("(System package managers often have outdated versions)")
        elif OS_NAME == 'darwin': print("  Using Homebrew: brew install node")
        elif OS_NAME == 'windows': print("  Using Chocolatey: choco install nodejs") # Installs latest node/npm

    elif tool_name == 'yarn':
        handled = True
        print("Requires Node.js and npm first.")
        print("Install using npm: npm install -g yarn")
        print("Official guide: https://classic.yarnpkg.com/en/docs/install")

    elif tool_name == 'ruby':
        handled = True
        print("Recommendation: Use a Ruby Version Manager like rbenv or RVM.")
        print("  rbenv: https://github.com/rbenv/rbenv#installation")
        print("  RVM: https://rvm.io/rvm/install")
        print("\nAlternatively, see official installation guides:")
        print("  https://www.ruby-lang.org/en/documentation/installation/")
        if OS_NAME == 'darwin': print("  Using Homebrew: brew install ruby")
        elif OS_NAME == 'windows': print("  Use RubyInstaller: https://rubyinstaller.org/")

    elif tool_name == 'bundle' or tool_name == 'bundler':
        handled = True
        print("Requires Ruby and RubyGems (comes with Ruby >= 1.9).")
        print("Install using gem: gem install bundler")

    elif tool_name == 'jekyll':
        handled = True
        print("Requires Ruby and Bundler.")
        print("Typically installed via Bundler using a Gemfile in your project.")
        print("  1. Create/Edit Gemfile in your project root, add: gem 'jekyll'")
        print("  2. Run: bundle install")
        print("See: https://jekyllrb.com/docs/installation/")
        print("Or install globally (less common): gem install jekyll")

    elif tool_name == 'hugo':
        handled = True
        print("Official guide: https://gohugo.io/installation/")
        if OS_NAME == 'linux':
             print("On Debian/Ubuntu: sudo apt update && sudo apt install hugo")
             print("On Fedora: sudo dnf install hugo")
             print("Check your specific distribution's package manager.")
        elif OS_NAME == 'darwin':
             print("  Using Homebrew: brew install hugo")
        elif OS_NAME == 'windows':
             print("  Using Chocolatey: choco install hugo-extended")
             print("  Using Scoop: scoop install hugo-extended")
             print("Or download executable from GitHub releases (see official guide).")

    if not handled:
        print(f"No specific installation suggestion available for '{tool_name}'. Please search online for instructions specific to '{OS_NAME}'.")

    print("-" * 35)


def run_command(command, check=True, capture_output=False, text=True, shell=False, cwd=None, suppress_output=False, input_data=None):
    """Runs a command using subprocess and handles errors correctly."""
    # Ensure command parts are strings
    command_str = [str(part) for part in command]
    # Avoid printing excessively noisy commands unless debugging needed
    # print(f"Running command: {' '.join(command_str)}{' in ' + str(cwd) if cwd else ''}")
    if not suppress_output: # Print only if not suppressed
         print(f"Running command: {' '.join(command_str)}{' in ' + str(cwd) if cwd else ''}")


    # Determine if output should be captured (for suppression or actual capture)
    should_capture = capture_output or suppress_output

    try:
        process = subprocess.run(
            command_str,
            check=check,
            capture_output=should_capture, # Use the main capture_output argument
            text=text,
            shell=shell,
            cwd=cwd,
            input=input_data
            # DO NOT pass stdout/stderr explicitly here, capture_output handles it
        )

        # If output was captured but *not* meant to be suppressed, print it
        if should_capture and not suppress_output:
             if process.stdout: print(f"Stdout:\n{process.stdout.strip()}")
             if process.stderr: print(f"Stderr:\n{process.stderr.strip()}")

        return process

    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(command_str)}")
        # Error output is available in e.stdout/e.stderr if capture_output was True
        if hasattr(e, 'stderr') and e.stderr:
            print(f"Stderr: {e.stderr.strip()}")
        if hasattr(e, 'stdout') and e.stdout:
             print(f"Stdout: {e.stdout.strip()}")
        raise # Re-raise the exception to stop the script if check=True
    except FileNotFoundError:
        # Handle command not found - suggest installation
        tool_name = command_str[0]
        suggest_installation(tool_name)
        print(f"Error: Command not found - '{tool_name}'. Please install it.")
        sys.exit(1) # Ensure exit
    except Exception as e:
        # Catch other potential exceptions during subprocess execution
        print(f"An unexpected error occurred running command: {' '.join(command_str)}")
        print(f"Error details: {e}")
        raise # Re-raise unexpected errors


def is_tool_installed(name):
    """Checks if a tool is available in the system's PATH."""
    return shutil.which(name) is not None


def prompt_user(message, default=None):
    """Prompts the user for input with an optional default."""
    prompt_text = f"{message} "
    if default:
        prompt_text += f"[{default}] "
    response = input(prompt_text).strip()
    return response or default


def prompt_yes_no(message, default_yes=True):
    """Prompts the user for a yes/no answer."""
    suffix = "(Y/n)" if default_yes else "(y/N)"
    while True:
        response = input(f"{message} {suffix} ").strip().lower()
        if not response:
            return default_yes
        if response in ['y', 'yes']:
            return True
        if response in ['n', 'no']:
            return False
        print("Please answer 'y' or 'n'.")


def check_gh_auth():
    """Checks if the user is logged into GitHub CLI."""
    print("Checking GitHub authentication status...")
    try:
        # Use suppress_output to avoid printing auth status details unless error
        run_command(["gh", "auth", "status"], check=True, suppress_output=True)
        print("GitHub CLI authentication verified.")
        return True
    except subprocess.CalledProcessError:
        print("Error: You are not logged into GitHub CLI ('gh').")
        print("Please run 'gh auth login', follow the prompts, then re-run this script.")
        return False
    except SystemExit: # Catch exit from FileNotFoundError in run_command
        print("Cannot check GitHub auth because 'gh' command failed.")
        return False


def get_repo_name_from_url(url):
    """Extracts 'USERNAME/REPONAME' from git URL."""
    if not url: return None
    if url.startswith("git@github.com:"): return url.split(":")[1].replace(".git", "")
    if url.startswith("https://github.com/"): return "/".join(url.split("/")[-2:]).replace(".git", "")
    return None


def check_repo_exists(repo_full_name):
    """Checks if a repository exists on GitHub using 'gh repo view'."""
    print(f"Checking if repository '{repo_full_name}' exists on GitHub...")
    try:
        run_command(["gh", "repo", "view", repo_full_name], check=True, suppress_output=True)
        print(f"Repository '{repo_full_name}' found.")
        return True
    except subprocess.CalledProcessError:
        print(f"Repository '{repo_full_name}' not found on GitHub.")
        return False
    except SystemExit: return False # gh not found


def create_repo(repo_full_name):
    """Creates a repository on GitHub using 'gh repo create'."""
    print(f"Attempting to create repository '{repo_full_name}'...")
    visibility = prompt_user("Make repository public or private?", default="public").lower()
    visibility_flag = "--public" if visibility == "public" else "--private"
    try:
        # Use --source=. to initialize with current dir contents, --push to push main/master
        # run_command will print the command being run
        run_command(["gh", "repo", "create", repo_full_name, visibility_flag, "--source=.", "--push"], check=True)
        print(f"Repository '{repo_full_name}' created successfully and local content pushed.")
        return True
    except subprocess.CalledProcessError:
        # Error details (stderr) should have been printed by run_command's exception handler
        print(f"Failed to create repository '{repo_full_name}'. See error above.")
        return False
    except SystemExit: return False # gh not found


def check_pages_setup(repo_full_name):
    """Checks GitHub Pages status using 'gh api'."""
    print(f"Checking GitHub Pages status for '{repo_full_name}'...")
    try:
        process = run_command(["gh", "api", f"repos/{repo_full_name}/pages"], check=False, capture_output=True, suppress_output=True)
        # rest of parsing logic...
        if process.returncode == 0:
            try:
                pages_info = json.loads(process.stdout)
                source = pages_info.get("source", {})
                branch = source.get("branch")
                path = source.get("path", "/")
                status = pages_info.get("status", "disabled") # Can be null, treat as disabled
                print(f"GitHub Pages status: {status if status else 'disabled'}")
                is_correctly_configured = (branch == DEPLOY_BRANCH and path == "/")
                if is_correctly_configured: print(f"GitHub Pages is configured correctly for branch '{DEPLOY_BRANCH}'.")
                else: print(f"GitHub Pages is configured for branch '{branch}', path '{path}'. Needs reconfiguration.")
                return is_correctly_configured, pages_info.get("html_url")
            except json.JSONDecodeError:
                print("Warning: Failed to parse GitHub Pages API response.")
                return False, None
        elif process.stderr and "404" in process.stderr: # Check stderr for 404 specifically
            print("GitHub Pages is not yet enabled for this repository.")
            return False, None
        else:
             # Some other error occurred during API call
             print(f"Warning: Could not reliably check GitHub Pages status.")
             if process.stderr: print(f"Stderr: {process.stderr.strip()}")
             return False, None
    except SystemExit: print("Cannot check Pages status because 'gh' command failed."); return False, None
    except Exception as e: print(f"Warning: An unexpected error occurred checking Pages status: {e}"); return False, None


def enable_pages(repo_full_name, branch, path="/"):
    """Enables or updates GitHub Pages using 'gh api'."""
    print(f"Attempting to enable/configure GitHub Pages from branch '{branch}' path '{path}'...")
    try:
        # run_command will print the command being run
        run_command(["gh", "api", "--method", "POST", f"repos/{repo_full_name}/pages", "-f", f"source[branch]={branch}", "-f", f"source[path]={path}"], check=True, suppress_output=False) # Show output
        print("GitHub Pages configuration updated successfully.")
        time.sleep(3) # Give API a moment to process
        # Re-check status to get the URL if possible
        _, html_url = check_pages_setup(repo_full_name)
        return True, html_url
    except subprocess.CalledProcessError:
        # Error details should have been printed by run_command
        print(f"Error: Failed to enable/configure GitHub Pages via API. Check permissions or do it manually after ensuring '{branch}' exists.")
        return False, None
    except SystemExit: print("Cannot enable Pages because 'gh' command failed."); return False, None
    except Exception as e: print(f"Warning: An unexpected error occurred enabling Pages: {e}"); return False, None


def detect_package_manager():
    """Detects preferred package manager based on lock files."""
    # Prioritize lock files only if the corresponding tool is installed
    if Path("yarn.lock").exists() and is_tool_installed("yarn"): return "yarn"
    if Path("package-lock.json").exists() and is_tool_installed("npm"): return "npm"
    # Fallback: check if commands exist
    if is_tool_installed("yarn"): return "yarn"
    if is_tool_installed("npm"): return "npm"
    return None


def run_build_step():
    """Asks for project type and runs the appropriate build command."""
    print("\n--- Build Step ---")
    project_type = prompt_user(
        "Select project type:\n"
        "  [1] Simple HTML/CSS/JS (no build, specify source dir)\n"
        "  [2] Node.js (React, Vue, Angular, etc.)\n"
        "  [3] Jekyll\n"
        "  [4] Hugo\n"
        "  [5] Other (build manually, specify output directory later)\n"
        "Enter choice:", default="1"
    )

    build_dir_path = None
    ASK_LATER_SENTINEL = "ASK_LATER"

    try:
        if project_type == '1':
            print("Selected: Simple HTML/CSS/JS")
            source_dir = prompt_user("Enter directory containing your HTML/CSS/JS files:", default=".")
            build_dir_path = Path(source_dir).resolve()
            if not build_dir_path.is_dir(): print(f"Error: Source directory '{build_dir_path}' not found."); return None
            print(f"Using '{build_dir_path}' as deployment source.")


        elif project_type == '2':
            print("Selected: Node.js project")
            # Check Node first
            if not is_tool_installed("node"): suggest_installation("node"); return None
            # Check npm (usually installed with node)
            if not is_tool_installed("npm"): suggest_installation("npm"); return None

            pkg_manager = detect_package_manager()
            if not pkg_manager:
                 print("Warning: Could not detect preferred package manager (yarn/npm). Falling back to npm.")
                 pkg_manager = "npm"

            # Specific check if yarn was detected/chosen but not installed
            if pkg_manager == "yarn" and not is_tool_installed("yarn"):
                 suggest_installation("yarn")
                 return None

            print(f"Using package manager: {pkg_manager}")
            install_cmd = [pkg_manager, "install"]
            build_cmd = [pkg_manager, "run", "build"]
            if not Path("package.json").exists(): print("Warning: package.json not found.")

            if prompt_yes_no(f"Run '{' '.join(install_cmd)}' first?", default_yes=False):
                 run_command(install_cmd, check=True) # Will exit via run_command if tool missing

            # print(f"Running build command: {' '.join(build_cmd)}") # run_command prints this now
            run_command(build_cmd, check=True) # Will exit via run_command if tool missing
            print("Build command completed.")

            default_dir = DEFAULT_BUILD_DIR
            if Path("build").is_dir() and not Path(DEFAULT_BUILD_DIR).is_dir(): default_dir = "build"
            output_dir = prompt_user("Enter the build output directory:", default=default_dir)
            build_dir_path = Path(output_dir).resolve()


        elif project_type == '3':
             print("Selected: Jekyll project")
             # Check essential tools
             if not is_tool_installed("ruby"): suggest_installation("ruby"); return None
             if not is_tool_installed("bundle"): suggest_installation("bundler"); return None
             if not is_tool_installed("jekyll"): print("Warning: 'jekyll' command not found directly. Relying on 'bundle exec'.")

             build_cmd = ["bundle", "exec", "jekyll", "build"]
             if Path("Gemfile").exists():
                  if prompt_yes_no("Run 'bundle install' first?", default_yes=False):
                        run_command(["bundle", "install"], check=True) # Exits if bundle missing

             # print(f"Running build command: {' '.join(build_cmd)}") # run_command prints this now
             run_command(build_cmd, check=True) # Exits if bundle missing
             print("Build command completed.")
             default_dir = "_site"
             output_dir = prompt_user("Enter the build output directory:", default=default_dir)
             build_dir_path = Path(output_dir).resolve()


        elif project_type == '4':
             print("Selected: Hugo project")
             if not is_tool_installed("hugo"): suggest_installation("hugo"); return None

             build_cmd = ["hugo"]
             # print(f"Running build command: {' '.join(build_cmd)}") # run_command prints this now
             run_command(build_cmd, check=True) # Exits if hugo missing
             print("Build command completed.")
             default_dir = "public"
             output_dir = prompt_user("Enter the build output directory:", default=default_dir)
             build_dir_path = Path(output_dir).resolve()

        elif project_type == '5':
            print("Selected: Other project type.")
            print("Please ensure your project is built manually.")
            build_dir_path = ASK_LATER_SENTINEL


        else: print("Invalid choice."); return None

        # Validation
        if build_dir_path != ASK_LATER_SENTINEL and (not build_dir_path or not build_dir_path.is_dir()):
             if build_dir_path: print(f"Error: Build directory '{build_dir_path}' not found/not a directory after build.")
             else: print("Error: Build directory path could not be determined.")
             return None

        return build_dir_path

    except subprocess.CalledProcessError: print(f"\nBuild step failed during command execution."); return None
    except SystemExit: print("\nBuild step aborted due to missing prerequisite."); return None # Catch exits from run_command
    except Exception as e:
        print(f"\nAn unexpected error occurred during the build step: {e}"); import traceback; traceback.print_exc(); return None


def deploy_files(build_dir_path, repo_url, branch):
    """Deploys files from build_dir to the specified branch."""
    print(f"\n--- Deployment Step ---")
    print(f"Deploying files from: {build_dir_path}")
    print(f"Target repository: {repo_url}")
    print(f"Target branch: {branch}")
    # Standardize timezone in commit message
    commit_msg = f"Deploy website updates - {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())} UTC"

    if not build_dir_path.is_dir(): print(f"Error: Build directory '{build_dir_path}' is not valid."); return False

    git_temp_dir = build_dir_path / ".git"
    if git_temp_dir.exists():
        print("Removing existing temporary .git directory...")
        # Use ignore_errors=True for robustness, especially on Windows
        shutil.rmtree(git_temp_dir, ignore_errors=True)

    try:
        print("Initializing temporary Git repository...")
        run_command(["git", "init", "-b", "main"], cwd=build_dir_path, suppress_output=True) # Use default branch name

        print("Adding remote origin...")
        run_command(["git", "remote", "add", "origin", repo_url], cwd=build_dir_path, suppress_output=True)

        # Handle CNAME file if it exists in project root
        cname_path = Path("CNAME")
        if cname_path.exists() and cname_path.is_file():
            print("CNAME file found in project root, copying to build directory.")
            try:
                 shutil.copy2(cname_path, build_dir_path / "CNAME")
            except Exception as copy_e:
                 print(f"Warning: Failed to copy CNAME file: {copy_e}")


        print("Adding files to commit...")
        run_command(["git", "add", "."], cwd=build_dir_path) # Add all in build dir

        print("Committing files...")
        # Check if there are changes to commit
        status_result = run_command(["git", "status", "--porcelain"], cwd=build_dir_path, capture_output=True, suppress_output=True, check=False)
        if not status_result.stdout.strip():
            print("No changes detected in build directory. Committing anyway to ensure branch exists.")
            # Use --allow-empty to avoid error if nothing changed
            run_command(["git", "commit", "--allow-empty", "-m", commit_msg], cwd=build_dir_path, suppress_output=True)
        else:
            # Commit staged changes
            run_command(["git", "commit", "-m", commit_msg], cwd=build_dir_path, suppress_output=True)


        # print(f"Force pushing to '{branch}'...") # run_command prints this now
        run_command(["git", "push", "--force", "origin", f"HEAD:{branch}"], cwd=build_dir_path) # Push temp HEAD to deploy branch

        print("Deployment push successful!")
        return True

    except subprocess.CalledProcessError:
        # Error details should have been printed by run_command
        print("Error during Git deployment steps.")
        return False
    except SystemExit: print("Deployment failed due to missing 'git' command."); return False # Catch git not found
    except Exception as e: print(f"An unexpected error occurred during deployment: {e}"); return False
    finally:
        # Clean up the temporary .git directory
        if git_temp_dir.exists():
            print("Cleaning up temporary Git directory...")
            shutil.rmtree(git_temp_dir, ignore_errors=True) # Use ignore_errors for robustness


def get_github_pages_url(repo_full_name):
    """Constructs the likely GitHub Pages URL."""
    if not repo_full_name or '/' not in repo_full_name: return None
    username, reponame = repo_full_name.split('/', 1)
    # Handle user/org pages (e.g., USERNAME.github.io)
    if reponame.lower() == f"{username.lower()}.github.io":
        return f"https://{username.lower()}.github.io/"
    else:
        return f"https://{username.lower()}.github.io/{reponame}/"


# --- Main Execution ---
def main():
    print("-" * 30)
    print("GitHub Pages Full Deployment Script (Build + Install Suggestions)")
    # Use current location and time context
    location = "Bengaluru, Karnataka, India"
    # Get current time using standard library
    current_time = time.localtime()
    # Format time similar to user request: Friday, March 28, 2025 at 12:57:48 AM
    # Note: Python's %I for 12-hour clock might not zero-pad, %p for AM/PM
    current_time_str = time.strftime('%A, %B %d, %Y at %I:%M:%S %p %Z', current_time)

    print(f"Location: {location}")
    print(f"Current time: {current_time_str}")
    print("-" * 30)

    # 1. Check prerequisites (git, gh)
    print("Checking prerequisites...")
    if not is_tool_installed("git"):
        suggest_installation("git")
        sys.exit(1)
    if not is_tool_installed("gh"):
        suggest_installation("gh")
        sys.exit(1)
    print("Core prerequisites (git, gh) met.")

    # 2. Check GitHub Authentication
    if not check_gh_auth(): sys.exit(1)

    # --- BUILD STEP ---
    # This now handles internal checks for build tools and suggests installation
    build_result = run_build_step()
    if build_result is None:
        print("\nBuild step failed or requires missing tools. Exiting.")
        sys.exit(1)
    ASK_LATER_SENTINEL = "ASK_LATER"
    # --- END BUILD STEP ---


    # 3. Check local Git repository status
    print("\n--- Repository Setup ---")
    is_repo = False
    detected_repo_url = None
    detected_repo_full_name = None
    try:
        # Check if current directory is a git repo
        run_command(["git", "rev-parse", "--is-inside-work-tree"], check=True, suppress_output=True)
        is_repo = True
        print("Current directory is a Git repository.")
        # Try to get origin URL
        try:
            process = run_command(["git", "config", "--get", "remote.origin.url"], check=False, capture_output=True, suppress_output=True)
            if process.returncode == 0:
                detected_repo_url = process.stdout.strip()
                detected_repo_full_name = get_repo_name_from_url(detected_repo_url)
            # Report detection status
            if detected_repo_full_name: print(f"Detected remote 'origin': {detected_repo_full_name}")
            elif detected_repo_url: print(f"Detected remote 'origin' URL: {detected_repo_url} (Could not parse name)")
            else: print("No remote named 'origin' found.")
        except Exception as e: print(f"Warning: Could not detect remote 'origin': {e}")

    except subprocess.CalledProcessError: # Not inside a git repo
        print("Current directory is not a Git repository.")
        if prompt_yes_no("Initialize a new Git repository here?", default_yes=False):
             run_command(["git", "init"], check=True); print("Git repository initialized."); is_repo = True
        else: print("Cannot proceed without a Git repository."); sys.exit(1)
    except SystemExit: # git command itself not found earlier
        print("Cannot check repo status because 'git' command failed."); sys.exit(1)


    # 4. Determine target repository
    target_repo_full_name = None
    if detected_repo_full_name and prompt_yes_no(f"Deploy to detected repo '{detected_repo_full_name}'?", default_yes=True):
        target_repo_full_name = detected_repo_full_name
    else:
        # Ask manually if not detected or user said no
        detected_repo_full_name = None # Ensure we ask if user declined default
        while not target_repo_full_name:
            repo_input = prompt_user("Enter target GitHub repository (USERNAME/REPONAME):")
            if repo_input and '/' in repo_input and len(repo_input.split('/')) == 2:
                target_repo_full_name = repo_input
            else: print("Invalid format. Please use 'USERNAME/REPONAME'.")


    # 5. Check remote repository / Create / Setup 'origin'
    repo_exists = check_repo_exists(target_repo_full_name)
    repo_url_https = f"https://github.com/{target_repo_full_name}.git" # Default to HTTPS

    if not repo_exists:
        # Ask user if they want to create the repo
        if prompt_yes_no(f"Repo '{target_repo_full_name}' not found. Create it (pushes current branch)?", default_yes=True):

            # --->>> ADDED: Attempt Initial Commit before gh repo create <<<---
            try:
                print("Attempting to make initial commit before creating repository...")
                run_command(["git", "add", "."], check=True, suppress_output=True) # Suppress output for 'add'
                # Use --allow-empty in case dir is empty; check=False safer if git user info not set
                run_command(["git", "commit", "--allow-empty", "-m", "Initial commit"], check=False, suppress_output=True) # Suppress output
                print("Initial commit attempted.")
            except SystemExit: # Catch if 'git' command itself is missing
                 print("Cannot make initial commit because 'git' command failed.")
                 sys.exit(1)
            except Exception as e:
                print(f"Warning: Could not create initial commit, proceeding anyway: {e}")
            # --->>> END: Initial Commit Attempt <<<---

            # Now call create_repo (which includes --push)
            if not create_repo(target_repo_full_name):
                # Failure message printed within create_repo or run_command
                sys.exit(1) # Failed to create
            # Assume gh repo create sets up the 'origin' remote upon success
            detected_repo_url = repo_url_https
            print(f"Repository created and 'origin' remote likely configured by 'gh'.")

        else:
            # User chose not to create the repo
            print("Cannot proceed without target repository."); sys.exit(1)
    else:
        # --- Logic for when the repo *already* exists ---
        print(f"Repository '{target_repo_full_name}' already exists. Checking remote 'origin'...")
        try:
            current_origin_url = run_command(["git", "config", "--get", "remote.origin.url"], check=False, capture_output=True, suppress_output=True).stdout.strip()
            current_origin_name = get_repo_name_from_url(current_origin_url)

            if not current_origin_url:
                 # No origin exists, add it
                 print(f"No remote 'origin' found. Adding it for {target_repo_full_name}...")
                 run_command(["git", "remote", "add", "origin", repo_url_https], check=True)
                 detected_repo_url = repo_url_https
            elif current_origin_name != target_repo_full_name:
                 # Origin exists but points elsewhere
                 if prompt_yes_no(f"Remote 'origin' points to '{current_origin_name}'. Set URL to target '{target_repo_full_name}'?", default_yes=True):
                      print(f"Setting 'origin' URL to {repo_url_https}...")
                      run_command(["git", "remote", "set-url", "origin", repo_url_https], check=True)
                      detected_repo_url = repo_url_https
                 else:
                      # User chose not to update origin, warn and use existing
                      print("Proceeding with current 'origin'. Deployment might target the wrong repository.")
                      repo_url_https = current_origin_url # Use the actual origin URL
                      target_repo_full_name = current_origin_name # Adjust target name to match for Pages config
            else:
                 # Origin exists and points to the correct repo
                 print(f"Remote 'origin' correctly points to {target_repo_full_name}.")
                 detected_repo_url = current_origin_url # Confirm the URL

        except SystemExit: print("Cannot configure remote 'origin' because 'git' command failed."); sys.exit(1)
        except Exception as e: print(f"Warning: Could not verify/update remote 'origin': {e}")
        # (End of 'else' block for existing repo)


    # Final check for the URL we will actually use for deployment
    try:
        repo_url_to_use = run_command(["git", "config", "--get", "remote.origin.url"], capture_output=True, suppress_output=True).stdout.strip()
        if not repo_url_to_use:
             print("Error: Could not determine repository URL for 'origin' after setup.")
             sys.exit(1)
    except SystemExit: print("Cannot get final remote URL because 'git' failed."); sys.exit(1)
    except Exception as e:
         print(f"Error getting final remote URL: {e}")
         # Fallback if possible, otherwise exit
         if detected_repo_url: repo_url_to_use = detected_repo_url; print("Warning: Using previously detected URL.")
         else: sys.exit(1)

    print(f"Configured to deploy to: {repo_url_to_use}")


    # 6. Determine final build directory path
    build_dir_path = None
    if build_result == ASK_LATER_SENTINEL: # Ask only if build step was skipped/manual
         build_dir_input = prompt_user(f"Enter the directory containing built files:", default=DEFAULT_BUILD_DIR)
         build_dir_path = Path(build_dir_input).resolve()
         # Validate the manually provided path
         if not build_dir_path.is_dir():
              print(f"Error: Specified build directory '{build_dir_path}' does not exist or is not a directory.")
              sys.exit(1)
    elif build_result and isinstance(build_result, Path): # Use path determined from build step
         build_dir_path = build_result
    else: # Should not happen if previous checks passed, but safeguard
         print("Error: Could not determine build directory path. Exiting.")
         sys.exit(1)

    print(f"Using final build directory for deployment: {build_dir_path}")


    # 7. Perform deployment push
    if not deploy_files(build_dir_path, repo_url_to_use, DEPLOY_BRANCH):
        print("Deployment failed.")
        sys.exit(1)


    # 8. Check/Enable GitHub Pages (after successful push)
    print("\n--- GitHub Pages Configuration ---")
    # Pass the target repo name determined earlier (might have been adjusted if origin mismatch)
    pages_configured, pages_url = check_pages_setup(target_repo_full_name)
    if not pages_configured:
        if prompt_yes_no(f"Configure GitHub Pages to serve from branch '{DEPLOY_BRANCH}' now?", default_yes=True):
             enabled, final_url = enable_pages(target_repo_full_name, DEPLOY_BRANCH)
             if enabled: pages_url = final_url; print("GitHub Pages configuration successful.")
             else: print("Failed to automatically configure GitHub Pages. Check repo settings manually.")
        else: print("Skipping GitHub Pages configuration.")


    # 9. Print Success
    print("-" * 30)
    print("Deployment process completed!")
    # Use the URL returned by enable_pages/check_pages_setup if available, otherwise calculate likely URL
    final_pages_url = pages_url or get_github_pages_url(target_repo_full_name)
    if final_pages_url:
        print(f"Site should be available shortly at: {final_pages_url}")
        print("(It might take a few minutes for GitHub Pages to build and update.)")
    else:
        print("Could not determine the GitHub Pages URL.")
    print("-" * 30)


# --- Script Entry Point ---
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except SystemExit as e:
         # Catch sys.exit calls to prevent traceback for planned exits
         # print(f"Exiting script (code: {e.code}).") # Optional debug message
         pass # Exit silently for planned exits
    except Exception as e:
         # Catch any other unexpected errors during main execution
         print(f"\nAn unexpected error occurred: {e}")
         import traceback
         traceback.print_exc()
         sys.exit(1)