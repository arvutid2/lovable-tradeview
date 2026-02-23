#!/usr/bin/env python3
"""
🔍 Setup Validation Script
Kontrollib et kõik vajalik on õigesti seadistatud
"""
import os
import sys
import json
from pathlib import Path

def check_env_file():
    """Kontrollib .env faili"""
    print("\n📋 Kontrollin .env faili...")
    env_file = Path(__file__).parent / '.env'
    
    if not env_file.exists():
        print("❌ .env faili pole leitud!")
        return False
    
    with open(env_file) as f:
        content = f.read()
    
    required_keys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
    missing = [k for k in required_keys if k not in content]
    
    if missing:
        print(f"❌ Puuduvad seadistused: {missing}")
        return False
    
    print("✅ .env fail on õigesti seadistatud")
    return True

def check_python_packages():
    """Kontrollib Python dependencie"""
    print("\n📦 Kontrollin Python pakette...")
    required = ['flask', 'flask_cors', 'supabase', 'pandas', 'pandas_ta']
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg.replace('-', '_'))
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"❌ Puuduvad pakendid: {missing}")
        print(f"   Jooksuta: pip install {' '.join(missing)}")
        return False
    
    print("✅ Kõik Python pakendid on installiga")
    return True

def check_bot_files():
    """Kontrollib et bot failid on olemas"""
    print("\n🤖 Kontrollin bot faile...")
    bot_dir = Path(__file__).parent / 'bot'
    required_files = ['api.py', 'bot.py', 'backtester.py', 'brain.py']
    missing = [f for f in required_files if not (bot_dir / f).exists()]
    
    if missing:
        print(f"❌ Puuduvad bot failid: {missing}")
        return False
    
    print("✅ Kõik bot failid on olemas")
    return True

def check_supabase_migration():
    """Kontrollib Supabase migrations"""
    print("\n💾 Kontrollin Supabase migrations...")
    migrations_dir = Path(__file__).parent / 'supabase' / 'migrations'
    
    if not migrations_dir.exists():
        print("❌ Migrations kaust puudub!")
        return False
    
    migrations = list(migrations_dir.glob('*.sql'))
    if not migrations:
        print("❌ SQL migrations pole leitud!")
        return False
    
    print(f"✅ Leitud {len(migrations)} SQL migrationit")
    return True

def check_react_components():
    """Kontrollib React komponente"""
    print("\n⚛️  Kontrollin React komponente...")
    src_dir = Path(__file__).parent / 'src'
    components = [
        'pages/Index.tsx',
        'components/dashboard/PortfolioBalance.tsx',
        'components/dashboard/BotControl.tsx',
        'components/dashboard/PriceChart.tsx'
    ]
    
    missing = [c for c in components if not (src_dir / c).exists()]
    
    if missing:
        print(f"❌ Puuduvad komponendid: {missing}")
        return False
    
    print(f"✅ Kõik {len(components)} komponenti on olemas")
    return True

def check_config_files():
    """Kontrollib seadiste faile"""
    print("\n⚙️  Kontrollin seadiste faile...")
    required = ['vite.config.ts', 'tsconfig.json', 'package.json']
    missing = [f for f in required if not Path(__file__).parent / f in Path(__file__).parent.iterdir()]
    
    if missing:
        print(f"❌ Seadiste failid puuduvad: {missing}")
    else:
        print("✅ Kõik seadiste failid on olemas")
    
    return True

def main():
    print("=" * 50)
    print("🔍 TRADING DASHBOARD SETUP VALIDATOR")
    print("=" * 50)
    
    checks = [
        ("Environment", check_env_file),
        ("Python Packages", check_python_packages),
        ("Bot Files", check_bot_files),
        ("Supabase Migrations", check_supabase_migration),
        ("React Components", check_react_components),
        ("Config Files", check_config_files),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"❌ Error checking {name}: {e}")
            results[name] = False
    
    print("\n" + "=" * 50)
    print("📊 VALIDATION SUMMARY")
    print("=" * 50)
    
    total = len(results)
    passed = sum(results.values())
    
    for name, passed_check in results.items():
        status = "✅" if passed_check else "❌"
        print(f"{status} {name}")
    
    print(f"\nResult: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 SUCCESS! Setup is ready!")
        print("\nNext steps:")
        print("1. cd bot && python api.py")
        print("2. npm run dev")
        print("3. Open http://localhost:5173")
        return 0
    else:
        print("\n⚠️ Some checks failed. Please fix and try again!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
