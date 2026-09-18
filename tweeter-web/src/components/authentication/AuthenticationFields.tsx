interface AuthenticationFieldsProps {
    doOnEnter: () => void;
    checkSubmitButtonStatus: () => boolean;
    setAlias: (value: string) => void;
    setPassword: (value: string) => void;
    setFirstName?: (value: string) => void;
    setLastName?: (value: string) => void;
    handleFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    imageUrl?: string;
}

export default function AuthenticationFields({ 
    doOnEnter, 
    checkSubmitButtonStatus,
    setAlias, 
    setPassword, 
    setFirstName, 
    setLastName,     
    handleFileChange, 
    imageUrl, 
}: AuthenticationFieldsProps) {
    const OnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key == "Enter" && !checkSubmitButtonStatus()) {
        doOnEnter();
    }
    };

    
    return (
        <>
        {setFirstName && setLastName && (
            <>
                <div className="form-floating">
                <input
                    type="text"
                    className="form-control"
                    size={50}
                    id="firstNameInput"
                    placeholder="First Name"
                    onKeyDown={OnEnter}
                    onChange={(event) => setFirstName(event.target.value)}
                />
                <label htmlFor="firstNameInput">First Name</label>
                </div>
                <div className="form-floating">
                <input
                    type="text"
                    className="form-control"
                    size={50}
                    id="lastNameInput"
                    placeholder="Last Name"
                    onKeyDown={OnEnter}
                    onChange={(event) => setLastName(event.target.value)}
                />
                <label htmlFor="lastNameInput">Last Name</label>
                </div>
            </>
        )}

        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            size={50}
            id="aliasInput"
            placeholder="name@example.com"
            onKeyDown={OnEnter}
            onChange={(event) => setAlias(event.target.value)}
          />
          <label htmlFor="aliasInput">Alias</label>
        </div>
        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="passwordInput"
            placeholder="Password"
            onKeyDown={OnEnter}
            onChange={(event) => setPassword(event.target.value)}
          />
          <label htmlFor="passwordInput">Password</label>
        </div>

        {handleFileChange && imageUrl && (
            <>
            <div className="form-floating mb-3">
            <input
                type="file"
                className="d-inline-block py-5 px-4 form-control bottom"
                id="imageFileInput"
                onKeyDown={OnEnter}
                onChange={handleFileChange}
            />
            {imageUrl.length > 0 && (
                <>
                <label htmlFor="imageFileInput">User Image</label>
                <img src={imageUrl} className="img-thumbnail" alt=""></img>
                </>
            )}
            </div>
            </>
        )}
      </>
    );
}