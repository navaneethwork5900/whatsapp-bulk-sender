async function processExcel() {

        const worksheet =
            workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(
            worksheet
        );

        // Remove duplicate numbers

        const uniqueNumbers = [
            ...new Set(
                jsonData.map(
                    row => String(row.mobile).trim()
                )
            )
        ];

        for (const mobile of uniqueNumbers) {

            try {

                const response = await fetch(
                    '/api/send',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            mobile
                        })
                    }
                );

                const result =
                    await response.json();

                // Success

                if (result.success) {

                    statusDiv.innerHTML += `
                        <div style="margin-bottom:15px;padding:15px;border-radius:10px;background:rgba(0,255,100,.15);border:1px solid rgba(0,255,100,.3);">
                            ✅ ${mobile}<br>
                            Journey Count: ${result.journeyCount}<br>
                            Loyalty Coupon: ${result.loyaltyCouponSent ? 'YES 🎉' : 'NO'}
                        </div>
                    `;
                }

                // Invalid WhatsApp number

                else {

                    statusDiv.innerHTML += `
                        <div style="margin-bottom:15px;padding:15px;border-radius:10px;background:rgba(255,0,0,.15);border:1px solid rgba(255,0,0,.3);">
                            ❌ ${mobile}<br>
                            ${result.message || 'Invalid WhatsApp Number'}
                        </div>
                    `;
                }

            } catch (error) {

                statusDiv.innerHTML += `
                    <div style="margin-bottom:15px;padding:15px;border-radius:10px;background:rgba(255,0,0,.15);border:1px solid rgba(255,0,0,.3);">
                        ❌ ${mobile}<br>
                        ${error.message}
                    </div>
                `;
            }
        }
    };

    reader.readAsArrayBuffer(file);
}
