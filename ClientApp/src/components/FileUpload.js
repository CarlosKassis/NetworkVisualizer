import React, { useState } from 'react';

function FileUploadSingle(props) {

    const [uploadedfile, setUploadedfile] = useState(null);

    const handleFileUpload = async () =>
    {
        try
        {
            if (uploadedfile == null)
            {
                return
            }

            let formData = new FormData();
            formData.append('file', uploadedfile);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'weatherforecast');

            xhr.onload = () => {
                props.onCallback(xhr.responseText)
            };

            xhr.send(formData);

        } catch (error) {
            alert(error)
        }
    }

    return (
        <div>
            <input type="file" onChange={(e) => setUploadedfile(e.target.files[0])} />
            <button onClick={handleFileUpload}>Upload</button>
        </div>
    );
}

export default FileUploadSingle;