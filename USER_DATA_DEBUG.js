// USER_DATA_DEBUG.js
// Debug script untuk menganalisis masalah user data di initializeRealtimeConnections
// Run this di browser console setelah login

(function debugUserData() {
    console.log("🔍 USER DATA DEBUG - WebSocket Connection Issue");
    console.log("=" .repeat(60));
    
    // Check localStorage user data
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    
    console.log("\n📊 STEP 1: Check stored data...");
    console.log("🔑 Token stored:", !!storedToken);
    console.log("👤 User stored:", !!storedUser);
    
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            console.log("\n👤 User data details:");
            console.log("- Username:", userData.username);
            console.log("- is_staff:", userData.is_staff);
            console.log("- is_active:", userData.is_active);
            console.log("- is_superuser:", userData.is_superuser);
            console.log("- Raw user object:", userData);
            
            // Check the specific condition that's failing
            const isAuthenticated = true; // We know token validation passed
            const isStaff = userData.is_staff;
            
            console.log("\n🔍 WebSocket connection criteria:");
            console.log("- isAuthenticated:", isAuthenticated);
            console.log("- user.is_staff:", isStaff);
            console.log("- accessToken available:", !!storedToken);
            
            const shouldConnectWebSocket = isAuthenticated && isStaff && !!storedToken;
            console.log("- Should connect WebSocket:", shouldConnectWebSocket);
            
            if (!shouldConnectWebSocket) {
                console.log("\n❌ ISSUE FOUND:");
                if (!isStaff) {
                    console.log("🚨 USER IS NOT STAFF!");
                    console.log("💡 This user needs is_staff=True in Django admin");
                    console.log("💡 Check Django admin -> Users -> Edit this user -> Staff status");
                }
                if (!storedToken) {
                    console.log("🚨 NO ACCESS TOKEN!");
                }
            } else {
                console.log("\n✅ All criteria met - this should work!");
                console.log("💡 There might be a timing issue in the auth store");
            }
            
        } catch (e) {
            console.error("❌ Failed to parse user data:", e);
        }
    } else {
        console.error("❌ No user data found in localStorage");
    }
    
    // Test what happens if we manually trigger WebSocket connection
    console.log("\n🧪 STEP 2: Testing manual WebSocket connection...");
    
    if (storedToken) {
        try {
            const wsUrl = `wss://f808-180-254-65-209.ngrok-free.app/ws/admin/orders/?token=${encodeURIComponent(storedToken)}`;
            console.log("🔌 Testing WebSocket URL:", wsUrl.replace(storedToken, '***[REDACTED]***'));
            
            const testWs = new WebSocket(wsUrl);
            
            testWs.onopen = () => {
                console.log("✅ MANUAL WEBSOCKET CONNECTION SUCCESSFUL!");
                console.log("🎯 The issue is in the auth state check, not the WebSocket itself");
                testWs.close();
            };
            
            testWs.onclose = (event) => {
                console.log(`🔴 WebSocket closed: ${event.code} - ${event.reason}`);
                
                switch (event.code) {
                    case 4403:
                        console.log("❌ BACKEND CONFIRMS: User is not admin/staff");
                        console.log("💡 Fix: Set is_staff=True in Django admin for this user");
                        break;
                    case 4401:
                        console.log("❌ BACKEND: Authentication failed - token issue");
                        break;
                    case 1000:
                        console.log("✅ Normal close - connection test completed");
                        break;
                    default:
                        console.log("❓ Unexpected close code");
                }
            };
            
            testWs.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
            };
            
            // Close test connection after 3 seconds
            setTimeout(() => {
                if (testWs.readyState === WebSocket.OPEN) {
                    testWs.close();
                }
            }, 3000);
            
        } catch (error) {
            console.error("❌ Failed to create test WebSocket:", error);
        }
    }
    
    // Provide solutions
    console.log("\n" + "=".repeat(60));
    console.log("🔧 SOLUTIONS:");
    console.log("");
    console.log("If user.is_staff is false or undefined:");
    console.log("1. 🔧 Go to Django Admin (/admin/)");
    console.log("2. 👤 Users section -> Find your user");
    console.log("3. ✅ Check 'Staff status' checkbox");
    console.log("4. 💾 Save changes");
    console.log("5. 🔄 Logout and login again in frontend");
    console.log("");
    console.log("If user.is_staff is true but still failing:");
    console.log("1. 🔄 Clear browser storage and login fresh");
    console.log("2. 🔍 Check auth store timing issues");
    console.log("3. 📝 Add more logging to initializeRealtimeConnections()");
    
})(); 