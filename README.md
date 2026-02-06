# SmallBiz BookKeeping Pro

Professional accounting software for small businesses - Progressive Web App

## Features

✅ **License-Protected** - Secure license key activation with device fingerprinting
✅ **Dashboard** - Real-time financial overview with charts
✅ **Transaction Management** - Add, edit, delete, bulk operations
✅ **Financial Reports** - Income Statement, Cash Flow, Category Analysis
✅ **Tax Center** - IRS Schedule C compliance reporting
✅ **Export Capabilities** - PDF and Excel exports
✅ **Professional Design** - Modern UI with Google Fonts

## License Keys (for testing)

- `SBKP-2025-XXXX-TRIAL` - Trial license
- `SBKP-2025-DEMO-00001` - Full license
- `SBKP-2025-PROD-12345` - Full license

## Deployment Instructions

### Option 1: Netlify (Recommended)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: (root)
4. The `netlify.toml` file handles all configuration

### Option 2: GitHub Pages

1. Push all files to your GitHub repository
2. Go to Settings → Pages
3. Select branch and root folder
4. Save and your site will be live

### Option 3: Local Testing

1. Install a local server (e.g., `python -m http.server 8000`)
2. Open browser to `http://localhost:8000`

## File Structure

```
smallbiz-bookkeeping-fresh/
├── index.html          # Main HTML structure
├── styles.css          # Professional styling
├── app.js              # Application logic
├── netlify.toml        # Deployment configuration
└── README.md           # This file
```

## Usage

1. **Activate License**: Enter a valid license key on the activation screen
2. **Add Transactions**: Click "Add Transaction" to record income/expenses
3. **View Dashboard**: See real-time financial overview with charts
4. **Generate Reports**: Select date range and generate financial reports
5. **Tax Center**: Generate Schedule C tax summaries by year
6. **Export Data**: Export reports to PDF or Excel

## Technical Details

- **No Backend Required**: All data stored in browser localStorage
- **Device Protection**: License keys tied to device fingerprint
- **Version**: 1.0.0
- **Cache Busting**: Automatic cache control headers
- **Responsive**: Works on desktop, tablet, and mobile

## Security Features

- License key validation with format checking
- Device fingerprinting prevents key sharing
- Anti-piracy protection
- Secure local storage

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Price

**$97 One-Time Purchase** - Lifetime access, no recurring fees

---

Built with ❤️ for small business owners
