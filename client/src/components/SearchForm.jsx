import SubmitBtn from "./SubmitBtn";

function SearchForm() {
    return (
        <form method="post" className="w-full md:w-[48%] flex items-center gap-2 bg-white shadow-md w-full max-w-md px-2 py-2">
            <input type="search" {...register("search")}name="search" placeholder="Rechercher une facture..." className="flex-grow bg-transparent focus:outline-none placeholder-gray-700 px-4 py-2 border rounded"/>
            <SubmitBtn value={"Rechercher"}/>
        </form>
    )
}

export default SearchForm;