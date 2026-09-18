interface AuthenticationFieldsProps {
    onEnter: (event: React.KeyboardEvent<HTMLElement>) => void;
    setAlias: (value: string) => void;
    setPassword: (value: string) => void;
    setFirstName?: (value: string) => void;
    setLastName?: (value: string) => void;
    handleFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    imageUrl?: string;
}

export default function AuthenticationFields({ 
    onEnter, 
    setAlias, 
    setPassword, 
    setFirstName, 
    setLastName,     
    handleFileChange, 
    imageUrl, 
}: AuthenticationFieldsProps) {
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
                    onKeyDown={onEnter}
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
                    onKeyDown={onEnter}
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
            onKeyDown={onEnter}
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
            onKeyDown={onEnter}
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
                onKeyDown={onEnter}
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