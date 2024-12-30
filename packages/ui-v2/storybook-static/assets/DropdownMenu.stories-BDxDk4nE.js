import{R as e,r as f}from"./index-Cqyox1Tj.js";import{D as i,a as d,b as C,c as b,f as m}from"./fruits-CZbL9byb.js";import"./index-DtqWk5t9.js";import"./index-DGXSSr1l.js";const x=[{id:12,name:"Carrot",emoji:"🥕",description:"A crunchy orange root vegetable, rich in beta-carotene and vitamin A."},{id:13,name:"Broccoli",emoji:"🥦",description:"A green vegetable with dense, nutritious florets, high in fiber and vitamins."},{id:14,name:"Tomato",emoji:"🍅",description:"Technically a fruit, but commonly used as a vegetable in cooking."},{id:15,name:"Eggplant",emoji:"🍆",description:"A purple vegetable with a meaty texture, popular in Mediterranean cuisine."},{id:16,name:"Corn",emoji:"🌽",description:"Sweet yellow kernels on a cob, enjoyed grilled, boiled, or popped."},{id:17,name:"Bell Pepper",emoji:"🫑",description:"A crisp, colorful vegetable that can be sweet or slightly bitter."},{id:18,name:"Cucumber",emoji:"🥒",description:"A refreshing green vegetable with high water content, often used in salads."},{id:19,name:"Potato",emoji:"🥔",description:"A starchy root vegetable that can be prepared in countless ways."},{id:20,name:"Mushroom",emoji:"🍄",description:"Technically a fungus, but commonly used as a vegetable in cooking."},{id:21,name:"Onion",emoji:"🧅",description:"A pungent bulb vegetable used as a base in many cuisines worldwide."}],s={fruits:m,vegetables:x},O={title:"Example/DropdownMenu",component:i,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{items:[1,2,3,4]},args:{}},o=()=>e.createElement(i,{defaultOpen:!0},e.createElement(d,null,e.createElement("button",null,"Click me!!")),e.createElement(C,null,e.createElement("div",null,e.createElement("h1",null,"Hello"),e.createElement("p",null,"How are you today?"),e.createElement(b,{onSelect:t=>console.log(t)},"Click me again"),e.createElement(b,{onSelect:t=>t.preventDefault()},"Click me, I won't close")))),r=()=>{const[t,p]=f.useState([m[6]]),[g,k]=f.useState([...s.fruits,...s.vegetables]),A=async n=>{await new Promise(u=>setTimeout(u,1e3));const l=s.fruits.filter(u=>u.name.toLowerCase().includes(n.toLowerCase()));k(l)};return e.createElement(i,{items:g,onSelect:(n,l)=>{n.preventDefault(),console.log(n,l)},renderItem:n=>e.createElement(c,{fruit:n}),defaultOpen:!0,onSearch:A},e.createElement(d,{showIcon:!0},e.createElement("div",{className:"flex items-center gap-2 justify-between"},e.createElement(c,{fruit:m[1]}),"(",t.length,")")),g.length===0&&e.createElement(C,null,e.createElement("div",null,"No items found")))},a=()=>{const t=[{name:"Vegetables",children:s.vegetables,emoji:"🥦"},{name:"Fruits",children:s.fruits,emoji:"🍎"}];return e.createElement("div",null,e.createElement(i,{defaultOpen:!0,items:t,renderItem:p=>e.createElement(c,{fruit:p})},e.createElement(d,null,e.createElement("button",{className:"text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"},"Select"))))},c=({fruit:t})=>e.createElement("div",null,`${t.emoji} ${t.name}`);o.__docgenInfo={description:"",methods:[],displayName:"DefaultDropdown"};r.__docgenInfo={description:"",methods:[],displayName:"MultiSelect"};a.__docgenInfo={description:"",methods:[],displayName:"NestedDropdown"};var w,h,v;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`() => {
  return <DropdownMenu defaultOpen={true}>
      <DropdownButton>
        <button>Click me!!</button>
      </DropdownButton>
      <DropdownContent>
        <div>
          <h1>Hello</h1>
          <p>How are you today?</p>
          <DropdownItem onSelect={e => console.log(e)}>
            Click me again
          </DropdownItem>
          <DropdownItem onSelect={e => e.preventDefault()}>
            Click me, I won't close
          </DropdownItem>
        </div>
      </DropdownContent>
    </DropdownMenu>;
}`,...(v=(h=o.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var D,y,E;r.parameters={...r.parameters,docs:{...(D=r.parameters)==null?void 0:D.docs,source:{originalSource:`() => {
  const [value, setValue] = useState([fruits[6]]);
  const [items, setItems] = useState([...fruitsAndVegetables.fruits, ...fruitsAndVegetables.vegetables]);
  const handleSearch = async (query: String) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Filters items on the name
    const filteredItems = fruitsAndVegetables.fruits.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    setItems(filteredItems);
  };
  return <DropdownMenu items={items} onSelect={(e, value) => {
    e.preventDefault();
    console.log(e, value);
  }} renderItem={item => <Fruit fruit={item} />} defaultOpen={true} onSearch={handleSearch}
  // isItemDisabled={(item) => item.id % 2 === 0}
  >
      <DropdownButton showIcon>
        <div className="flex items-center gap-2 justify-between">
          <Fruit fruit={fruits[1]} />({value.length})
        </div>
      </DropdownButton>

      {items.length === 0 && <DropdownContent>
          <div>No items found</div>
        </DropdownContent>}
    </DropdownMenu>;
}`,...(E=(y=r.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};var S,I,j;a.parameters={...a.parameters,docs:{...(S=a.parameters)==null?void 0:S.docs,source:{originalSource:`() => {
  const items = [{
    name: "Vegetables",
    children: fruitsAndVegetables.vegetables,
    emoji: "🥦"
  }, {
    name: "Fruits",
    children: fruitsAndVegetables.fruits,
    emoji: "🍎"
  }];
  return <div>
      <DropdownMenu defaultOpen={true} items={items} renderItem={item => <Fruit fruit={item} />}>
        <DropdownButton>
          <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
            Select
          </button>
        </DropdownButton>
      </DropdownMenu>
    </div>;
}`,...(j=(I=a.parameters)==null?void 0:I.docs)==null?void 0:j.source}}};const _=["DefaultDropdown","MultiSelect","NestedDropdown"];export{o as DefaultDropdown,r as MultiSelect,a as NestedDropdown,_ as __namedExportsOrder,O as default};
