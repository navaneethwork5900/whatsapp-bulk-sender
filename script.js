async function processExcel() {

    const fileInput = document.getElementById('excelFile');

    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload an Excel file');
        return;
    }

    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const statusDiv = document.getElementById('status');

    statusDiv.innerHTML = 'Sending messages...<br><br>';

    for (const row of jsonData) {

        const mobile = row.mobile;

        if (!mobile) continue;

        try {

            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mobile: String(mobile)
                })
            });

            const result = await response.json();

            console.log(result);

            statusDiv.innerHTML += `✅ Sent to ${mobile}<br>`;

        } catch (error) {

            console.error(error);

            statusDiv.innerHTML += `❌ Failed ${mobile}<br>`;
        }
    }

    statusDiv.innerHTML += '<br>🎉 Completed';
}
