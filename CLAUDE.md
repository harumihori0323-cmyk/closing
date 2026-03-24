## CI/CD設定

### GitHub Actions（PR時に自動実行）
| チェック | 対象 | コマンド |
|---------|------|---------|
| TypeScript | frontend | `npx tsc --noEmit` |
| Lint (JS/TS) | frontend | `npm run lint` |
| Build | frontend | `npm run build` |
| Lint (Python) | backend | `flake8 --max-line-length=120` |
| Format (Python) | backend | `black --check --line-length=120` |

### ブランチ戦略
- `master`: 本番環境
- `develop`: 開発統合ブランチ
- `feature/*`: 機能開発ブランチ

### リポジトリ
- URL: https://github.com/haruminchan-lab/closing-support
- 公開設定: Private
